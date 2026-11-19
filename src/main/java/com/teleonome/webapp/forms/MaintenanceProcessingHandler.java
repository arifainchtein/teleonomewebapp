package com.teleonome.webapp.forms;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.fertilizer.FertilizationResult;
import com.teleonome.framework.fertilizer.FertilizerEngine;
import com.teleonome.framework.utils.Utils;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

/**
 * Fertilizing from the Diagnostics page (2026-11-19). "Stop Hypothalamus" sends a token with its code; the Hypothalamus,
 * having checked the code, writes HypothalamusStopped.info with that token and an end time, and exits. While the file
 * is there the Medula leaves the Hypothalamus stopped and Teleonome.denome alone, and the browser that holds the token
 * may, through this handler:
 *   status     whether it is stopped (no token needed), until when, the sperms in avocado/, the backups of this stop
 *   dryrun     fertilize a sperm into the Denome in memory and show what would change (nothing written)
 *   fertilize  the same, then: the Denome before into avocado/Sperm_Fert/&lt;time&gt;/ (as the Fertilizer does, so its -u
 *              also undoes it), the new Denome into Teleonome.denome (written whole, then moved into place)
 *   undo       put back the Denome from before the last fertilization of this stop
 *   start      delete HypothalamusStopped.info and start the Hypothalamus (StartHypothalamusBG.sh)
 * The 6-digit code cannot be checked here (on Annabelle the ESP32 checks it, through the Hypothalamus), which is why
 * the token is given at Stop, when the code is checked. Nothing is done while the Hypothalamus process is alive.
 */
public class MaintenanceProcessingHandler extends ProcessingFormHandler {

	private static final String SPERM_FOLDER = "avocado/";
	private static final String BACKUP_FOLDER = "avocado/Sperm_Fert/";
	private static final String PRE_FERTILIZATION = "TeleonomePreFertilization.denome";

	public MaintenanceProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		JSONObject answer;
		try {
			answer = act(request.getParameter("action"), request.getParameter("token"), request.getParameter("sperm"));
		} catch (Exception e) {
			logger.warn(Utils.getStringException(e));
			answer = new JSONObject().put("error", e.getClass().getSimpleName() + ": " + e.getMessage());
		}
		response.setContentType("application/json");
		PrintWriter out = response.getWriter();
		out.print(answer.toString());
		out.flush();
		out.close();
	}

	private JSONObject act(String action, String token, String spermName) throws IOException, JSONException {
		String dir = Utils.getLocalDirectory();
		JSONObject stop = readStop(dir);
		if ("status".equals(action)) return status(dir, stop, token);

		if (stop == null) return error("The Hypothalamus was not stopped for maintenance (press Stop Hypothalamus first), or the stop has expired.");
		if (token == null || !token.equals(stop.optString("Token"))) return error("Only the browser that stopped the Hypothalamus can do this.");
		if (hypothalamusRunning(dir)) return error("The Hypothalamus is still running: wait for it to stop at the end of its cycle.");

		switch (action == null ? "" : action) {
		case "dryrun":
		case "fertilize": {
			File sperm = spermFile(dir, spermName);
			if (sperm == null) return error("No such sperm in " + SPERM_FOLDER + ": " + spermName);
			File denomeFile = currentDenome(dir);
			if (denomeFile == null) return error("Neither Teleonome.denome nor Teleonome.previous_pulse is a valid Denome.");
			JSONObject denome = new JSONObject(FileUtils.readFileToString(denomeFile, StandardCharsets.UTF_8));
			FertilizationResult result = FertilizerEngine.fertilize(denome, new JSONObject(FileUtils.readFileToString(sperm, StandardCharsets.UTF_8)));
			JSONObject a = result.toJSON().put("Sperm", sperm.getName()).put("From", denomeFile.getName());
			if (!result.ok || "dryrun".equals(action)) return a.put("Written", false);
			// keep the Denome from before, then put the new one in place in one move
			File backup = new File(dir + BACKUP_FOLDER + new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date()));
			backup.mkdirs();
			FileUtils.copyFile(denomeFile, new File(backup, PRE_FERTILIZATION));
			FileUtils.copyFile(sperm, new File(backup, sperm.getName()));
			writeDenome(dir, result.denome.toString(4));
			logger.warn("fertilized " + sperm.getName() + " from the Diagnostics page, backup " + backup.getName());
			return a.put("Written", true).put("Backup", backup.getName());
		}
		case "undo": {
			File last = lastBackup(dir, stop.optLong("Stopped At", 0));
			if (last == null) return error("Nothing to undo: no fertilization since the Hypothalamus was stopped.");
			writeDenome(dir, FileUtils.readFileToString(new File(last, PRE_FERTILIZATION), StandardCharsets.UTF_8));
			FileUtils.deleteDirectory(last);
			logger.warn("undid the fertilization " + last.getName() + " from the Diagnostics page");
			return new JSONObject().put("Undone", last.getName());
		}
		case "start": {
			FileUtils.deleteQuietly(new File(dir + TeleonomeConstants.HYPOTHALAMUS_STOPPED_FILE));
			Runtime.getRuntime().exec(new String[] { "bash", "-c",
					"cd '" + dir + "' && sudo setsid nohup sh StartHypothalamusBG.sh > /dev/null 2>&1 &" });
			logger.warn("Hypothalamus started from the Diagnostics page");
			return new JSONObject().put("Started", true);
		}
		default:
			return error("Unknown action " + action);
		}
	}

	private JSONObject status(String dir, JSONObject stop, String token) {
		JSONObject s = new JSONObject();
		s.put("Stopped", stop != null);
		s.put("Hypothalamus Running", hypothalamusRunning(dir));
		if (stop == null) return s;
		s.put("Until", stop.optLong("Until"));
		s.put("Until Text", stop.optString("Until Text"));
		s.put("Mine", token != null && token.equals(stop.optString("Token")));
		if (!s.getBoolean("Mine")) return s;
		JSONArray sperms = new JSONArray();
		File[] files = new File(dir + SPERM_FOLDER).listFiles((d, n) -> n.endsWith(".sperm"));
		if (files != null) {
			Arrays.sort(files, (x, y) -> x.getName().compareToIgnoreCase(y.getName()));
			for (File f : files) {
				JSONObject one = new JSONObject().put("Name", f.getName());
				try {
					JSONObject purpose = new JSONObject(FileUtils.readFileToString(f, StandardCharsets.UTF_8)).getJSONObject("Sperm").getJSONObject("Purpose");
					one.put("Description", purpose.optString("Description", ""));
				} catch (Exception e) {
					one.put("Description", "not a valid sperm: " + e.getMessage());
				}
				sperms.put(one);
			}
		}
		s.put("Sperms", sperms);
		File last = lastBackup(dir, stop.optLong("Stopped At", 0));
		s.put("Can Undo", last != null);
		return s;
	}

	private static JSONObject error(String why) { return new JSONObject().put("error", why); }

	// the stop file, when there and not expired
	private static JSONObject readStop(String dir) {
		File f = new File(dir + TeleonomeConstants.HYPOTHALAMUS_STOPPED_FILE);
		if (!f.isFile()) return null;
		try {
			JSONObject stop = new JSONObject(FileUtils.readFileToString(f, StandardCharsets.UTF_8));
			return System.currentTimeMillis() < stop.optLong("Until", 0) ? stop : null;
		} catch (IOException | JSONException e) {
			return null;
		}
	}

	private static boolean hypothalamusRunning(String dir) {
		try {
			String pid = FileUtils.readFileToString(new File(dir + "PaceMakerProcess.info"), StandardCharsets.UTF_8).split("@")[0].trim();
			return pid.matches("\\d+") && new File("/proc/" + pid).isDirectory();
		} catch (IOException e) {
			return false;
		}
	}

	// a sperm of avocado/ by its file name only (no folders)
	private static File spermFile(String dir, String name) {
		if (name == null || !name.matches("[A-Za-z0-9 _.\\-]+\\.sperm")) return null;
		File f = new File(dir + SPERM_FOLDER + name);
		return f.isFile() ? f : null;
	}

	// the Denome to fertilize: Teleonome.denome, or the previous pulse if a stop cut it
	private static File currentDenome(String dir) {
		for (String name : new String[] { "Teleonome.denome", "Teleonome.previous_pulse" }) {
			File f = new File(dir + name);
			try {
				if (f.isFile() && f.length() > 0) { new JSONObject(FileUtils.readFileToString(f, StandardCharsets.UTF_8)).getJSONObject("Denome"); return f; }
			} catch (IOException | JSONException e) {
				// try the next
			}
		}
		return null;
	}

	private static void writeDenome(String dir, String content) throws IOException {
		File tmp = new File(dir + "Teleonome.denome.fertilizing");
		FileUtils.writeStringToFile(tmp, content, StandardCharsets.UTF_8);
		Files.move(tmp.toPath(), new File(dir + "Teleonome.denome").toPath(), StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
	}

	// the newest backup made since the stop began
	private static File lastBackup(String dir, long stoppedAt) {
		File[] all = new File(dir + BACKUP_FOLDER).listFiles(File::isDirectory);
		File best = null;
		for (File d : all == null ? new File[0] : all) {
			if (!new File(d, PRE_FERTILIZATION).isFile() || d.lastModified() < stoppedAt) continue;
			if (best == null || d.getName().compareTo(best.getName()) > 0) best = d;
		}
		return best;
	}
}
