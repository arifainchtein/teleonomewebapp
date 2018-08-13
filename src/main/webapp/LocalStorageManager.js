class LocalStorageManager{
	constructor(){
		
	}
	
	getAllStorageForComponent(localStorageComponentKey) {
        var values = [];
        var searchObj = JSON.parse(localStorage.getItem(localStorageComponentKey));
        console.log("searchObj=" + searchObj);
        if(searchObj==null)return values;
       // var searchObj = JSON.parse(searchObj1);
        
        if(searchObj != undefined && searchObj!=null){
            
            var keys = Object.keys(searchObj);
            for(var key in searchObj){
                if (searchObj.hasOwnProperty(key)) {
                    var parsed = JSON.parse(searchObj[key])
                   
                    values.push( searchObj[key] );
                }
            }
        }
    
        values.sort(function(a, b) { 
            return a.position - b.position;
        })
    
        
        return values;
    }
	
	 getNumberOfObjectsByComponent(localStorageComponentKey){
	        var searchObj = JSON.parse(localStorage.getItem(localStorageComponentKey));
	        //console.log("searchObj=" + searchObj);
	        if(searchObj==null){
	            return 0;
	        }else{
	            return (Object.keys(searchObj).length);
	        }
	    
	    }
}
