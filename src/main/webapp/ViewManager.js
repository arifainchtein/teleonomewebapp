class ViewManager{



	constructor(){

	}

	//
	// Diagnostic Menu 
	//
	AsynchronousDiagnostics(){       
		var n = new AsynchronousDiagnostics();
		var html = n.process();
		$('#DiagnosticsWorkArea').html(html);
		$('#DiagnosticsWorkArea').show();
	}


	SynchronousDiagnostics(){
		var n = new SynchronousDiagnostics();
		var html = n.process();
		$('#DiagnosticsWorkArea').html(html);
		$('#DiagnosticsWorkArea').show();

	} 

	SystemDiagnostics(panelPointer){
		if(panelPointer!=undefined){
			var n = new SystemDiagnostics();
			var html = n.process();
			var systemDiagnosticsPanelPointer = "@" +teleonomeName + ":" + NUCLEI_HUMAN_INTERFACE + ":" +panelPointer;
			renderPageByPointer(systemDiagnosticsPanelPointer, "DiagnosticsWorkArea");
			$('#DiagnosticsWorkArea').show();
		}
	}

	MnemosyconsDiagnostics(){
		var n = new Mnemosycons();
		var html = n.process();
		$('#DiagnosticsWorkArea').html(html);
		$('#DiagnosticsWorkArea').show();

	}



//	Settings Menu

	DeviceInfo(){
		var panelPointer  = $(this).data("panelpointer");
		var n = new DeviceInfo();
		var html = n.process();
		$('#SettingsWorkArea').html(html);
		$('#SettingsWorkArea').show();
	}


	UpdateParams(){
		var panelPointer  = $(this).data("panelpointer");
		if(panelPointer != undefined){
			var n = new UpdateParams();
			var html = n.process(panelPointer);
			$('#SettingsWorkArea').html(html);
			$('#SettingsWorkArea').show();
		}
	}

	WiFi(){
		var panelPointer  = $(this).data("panelpointer");
		var n = new Networking(panelPointer);
		var html = n.process(panelPointer);

		$('#SettingsWorkArea').html(html);
		$(".BSswitch").bootstrapSwitch();
		$('#SettingsWorkArea').show();
	}
}