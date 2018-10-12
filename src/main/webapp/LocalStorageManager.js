class LocalStorageManager{
	constructor(){
		
	}
	
	removeItem(localStorageComponentKey, objectKey){
		var searchObject = JSON.parse(localStorage.getItem(localStorageComponentKey));
		delete searchObject[objectKey];
		localStorage.setItem(localStorageComponentKey, JSON.stringify(searchObject));
	}
	
	removeComponentInfo(localStorageComponentKey){
		
		localStorage.removeItem(localStorageComponentKey);
	}
	
	getItem(localStoreageKey, objectKey){
		
		return localStorage.getItem(localStoreageKey);
	}
	
	setItem(localStorageComponentKey, object){
		 localStorage.setItem(localStorageComponentKey, JSON.stringify(object));
	}
			
	
	getAllStorageForComponent(localStorageComponentKey) {
        var values = [];
        var searchObj = JSON.parse(localStorage.getItem(localStorageComponentKey));
        if(searchObj==null)return values;
        // console.log("searchObj=" + searchObj);
        //var searchObj1 = JSON.parse(searchObj);
       // // console.log("searchObj1=" + searchObj1);
        //if(searchObj1 != undefined && searchObj1!=null){
        if(searchObj != undefined && searchObj!=null){    
            var keys = Object.keys(searchObj);
            for(var key in searchObj){
                if (searchObj.hasOwnProperty(key)) {
                  //  var parsed = JSON.parse(searchObj1[key])
                   
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
	        //// console.log("searchObj=" + searchObj);
	        if(searchObj==null){
	            return 0;
	        }else{
	            return (Object.keys(searchObj).length);
	        }
	    
	    }
}
