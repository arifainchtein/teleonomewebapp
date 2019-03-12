package com.teleonome.webapp.forms;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FilenameUtils;

import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.utils.Utils;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

public class GetLogFileNamesProcessingHandler extends ProcessingFormHandler {

	public GetLogFileNamesProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		String dirName = request.getParameter("dirName");
		StringBuffer toReturn = new StringBuffer();
		File logDir = new File(Utils.getLocalDirectory() + "tomcat/webapps/ROOT/logs/" + dirName);
		File[] files = logDir.listFiles();
		if(files!=null && files.length>0) {
			for(int i=0;i<files.length;i++) {
				if(i>0)toReturn.append(",");
				toReturn.append(FilenameUtils.getBaseName(files[i].getAbsolutePath()));
			}
		}
		response.setContentType("text/html;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(toReturn.toString());
		out.flush();
		out.close();
	}

}
