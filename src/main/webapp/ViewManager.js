class ViewManager{
	
	constructor(){

    }
    
    //
    // Diagnostic Menu 
    //
    AsynchronousDiagnostics(){
        var limit = $("#limit option:selected").val();
        var userLogs = $("#UserLogs").is(':checked')? "Yes":"No";
        var systemLogs = $("#SystemLogs").is(':checked')? "Yes":"No";
        var offset=1;
        renderAsyncCommands(userLogs,systemLogs, limit, offset );
    }

   
     SynchronousDiagnostics(){

     } 
     
     SystemDiagnostics(){

     }


    //
    // Settings Menu
    //
    DeviceInfo(){

    }


    UpdateParams(){
    }
    
    WiFi(){

    }

}