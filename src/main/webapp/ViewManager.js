class ViewManager{
    
    

	constructor(){

    }
    
    //
    // Diagnostic Menu 
    //
    AsynchronousDiagnostics(data){
        var stateData = JSON.parse(data);
       renderAsyncCommands(stateData.userLogs,stateData.systemLogs, stateData.limit, stateData.offset );
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