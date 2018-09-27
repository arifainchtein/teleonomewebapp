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
     
     SystemDiagnostics(){
        var n = new SystemDiagnostics();
        var html = n.process();
        $('#DiagnosticsWorkArea').html(html);
        $('#DiagnosticsWorkArea').show();

     }


    //
    // Settings Menu
    //
    DeviceInfo(data){
        var stateData = JSON.parse(data);

    }


    UpdateParams(data){
        var stateData = JSON.parse(data);
    }
    
    WiFi(data){
        var stateData = JSON.parse(data);

    }

}