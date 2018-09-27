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

   
     SynchronousDiagnostics(data){
        var stateData = JSON.parse(data);

     } 
     
     SystemDiagnostics(data){
        var stateData = JSON.parse(data);

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