class SearchFunctions{
	
	refreshSearchPage(){
        if(!refreshCounterStatus){
            return false;
        }
    
        //var allGraphs = allSearchStorage();
        var allGraphs = allSearchStorage(); 
        if(allGraphs.length==0){
            console.log('no refresh since there are no visuzliaers');
            $("#RefreshCounter").html("");
            refreshCounter=0;
            return false;
        } 
       // location.reload();
       console.log("about to refresh");
      
        $("#EntryPoint").empty();
        
        $('#WaitingText').html("Updating...");
       $('#WaitingWheel').show();
    
       generateAllGraphs();
    
       
        
        $('#WaitingWheel').hide();
        refreshCounter=30;
        $("#RefreshCounter").html(refreshCounter);
        
    }
	
	 refreshCounterUpdate(){
	        if(!refreshCounterStatus){
	            $("#RefreshCounter").html("||");
	            $("#RefreshCounterMessage").html("Click to Start");
	            return false;
	        }
	        var allGraphs = localStorageManager.getAllStorageForComponent(localStorageSearchKey);
	        refreshCounter--;
	        
	        if(allGraphs.length==0){
	            $("#RefreshCounter").html("");
	            $("#RefreshCounterMessage").html("");
	        }else{
	            $("#RefreshCounter").html(refreshCounter);
	            $("#RefreshCounterMessage").html("Click to Pause");
	        }
	        
	    
	    }
}