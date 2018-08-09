class MnemosyneTable{

    constructor(){

    }

    process(){
        //
        // the info for this panel is stored in a denechain that contains one dene, that dene
        // has the following denewords
        //
        var processingDeneWord;
        var processingDeneWordName;

        var panelDeneWords = denes[0].DeneWords;
        var i34=0;
        var sortingOrder="Descending";
        var dataSourcePointer="";
        var tDClassInfo="";
        var columnDefinitionPointer;
        var columnDefinitionDene;
        var sortingParameter;
        var columnDefinitions=[];
        var panelTitle="";
        var columnInTablePosition;
        var columnHeader;
        var k6;
        var denewWords;
        var deneWord;
        var columnDefinitionHeaderDenesHashMap = new HashMap();
        var columnDefinitionDataSourcePointerHashMap = new HashMap();
        var columnDefinitionTDClassInfoHashMap = new HashMap();
        
        var columnDefinitionDenesHashMap = new HashMap();
        for(i34=0;i34<panelDeneWords.length;i34++){
            processingDeneWord = panelDeneWords[i34];
            processingDeneWordName = processingDeneWord.Name;
            if(processingDeneWordName === SORTING_ORDER){
                sortingOrder = processingDeneWord.Value;
            }else if(processingDeneWordName === SORTING_PARAMETER){
                sortingParameter = processingDeneWord.Value;
            }else if(processingDeneWordName === PANEL_TITLE){
                panelTitle = processingDeneWord.Value;
            }else{
                if(processingDeneWord.hasOwnProperty(DENEWORD_DENEWORD_TYPE_ATTRIBUTE)){
                    if(processingDeneWord[DENEWORD_DENEWORD_TYPE_ATTRIBUTE]===DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER){
                        dataSourcePointer=processingDeneWord.Value;
                    }else if(processingDeneWord[DENEWORD_DENEWORD_TYPE_ATTRIBUTE]===DENEWORD_DISPLAY_TABLE_COLUMN_DEFINITION_POINTER){
                        columnDefinitionPointer=processingDeneWord.Value;
                        columnDefinitionDene = getDeneByIdentityPointer(columnDefinitionPointer);
                        deneWords = columnDefinitionDene["DeneWords"];
                        columnInTablePosition=-1;
                        
                        for(k6=0;k6<deneWords.length;k6++){
                            deneWord = deneWords[k6];
                            if(deneWord.hasOwnProperty(DENEWORD_DENEWORD_TYPE_ATTRIBUTE) && deneWord[DENEWORD_DENEWORD_TYPE_ATTRIBUTE]===DENEWORD_TYPE_COLUMN_IN_TABLE_POSITION){
                                columnInTablePosition = deneWord["Value"];
                            }else if(deneWord.hasOwnProperty(DENEWORD_DENEWORD_TYPE_ATTRIBUTE) && deneWord[DENEWORD_DENEWORD_TYPE_ATTRIBUTE]===DENEWORD_TYPE_COLUMN_HEADER){
                                columnHeader = deneWord["Value"];
                            }else if(deneWord.hasOwnProperty(DENEWORD_DENEWORD_TYPE_ATTRIBUTE) && deneWord[DENEWORD_DENEWORD_TYPE_ATTRIBUTE]===DENEWORD_TYPE_COLUMN_DATA_SOURCE_POINTER){
                                dataSourcePointer = deneWord["Value"];
                            }else if(deneWord.hasOwnProperty(DENEWORD_DENEWORD_TYPE_ATTRIBUTE) && deneWord[DENEWORD_DENEWORD_TYPE_ATTRIBUTE]===DENEWORD_TYPE_COLUMN_TD_CLASS_INFO){
                                tDClassInfo  = deneWord["Value"];
                            }
                        }
                        
                        if(columnInTablePosition!=-1 ){
                            columnDefinitionHeaderDenesHashMap.put(columnInTablePosition,columnHeader);
                            columnDefinitionDataSourcePointerHashMap.put(columnInTablePosition,dataSourcePointer);
                            columnDefinitionTDClassInfoHashMap.put(columnInTablePosition,tDClassInfo);
                        }
                        
                    }
                }
            }
        }
        
                        
        //
        // sortedColumnDefinitionDenesHashMap is an array that will contain the information for every column in the table
        // the dene looks like:
//				 {
//                     "DeneWords": [
//                     {
//                         "Required": "true",
//                         "DeneWord Type": "Column Data Source Pointer",
//                         "Value": "@Sento:Mnemosyine:Mnemosyne Today:Run Completed:Last Run Pump Start Time",
//                         "Name": "Turn Pump Off",
//                         "Value Type": "Dene Pointer"
//                     },
//                     {
//                         "Required": "true",
//                         "Value": 1,
//                         "Name": "Column Position",
//                         "Value Type": "int"
//                     },
//                     {
//                         "Required": "true",
//                         "Value": "Start",
//                         "Name": "Column Header",
//                         "Value Type": "String"
//                     },
//					   {
//              			"Required": "true",
//                          "Value": "visible-md visible-lg",
//                          "Name": "TDClassInfo",
//                          "Value Type": "String"
//                     }
        
        
        
//						],
//                     "Name": "Today Pumping History Col 1"
//                  }
        
        
        

        
        var panelHTML = "<div class=\"col-lg-12\">";
        panelHTML += "<div class=\"bs-component\">";
        panelHTML += "<div class=\"panel panel-default\">";
        panelHTML += " <div class=\"panel-heading\"><h4>" + panelTitle +"</h4></div>";
        panelHTML += "<div class=\"panel-body\">";
        panelHTML += "<table class=\"table table-stripped\">";
        var sortedColumnDefinitionHeaderDenesHashMap= sortHashMap(columnDefinitionHeaderDenesHashMap);
        var sortedColumnDefinitionDataSourcePointerHashMap= sortHashMap(columnDefinitionDataSourcePointerHashMap);
        var sortedColumnDefinitionTDClassInfoHashMap= sortHashMap(columnDefinitionTDClassInfoHashMap);
        
        var object2 = sortedColumnDefinitionHeaderDenesHashMap["_map"];
        var sortedColumnDefinitionTDClassInfoMap = sortedColumnDefinitionTDClassInfoHashMap["_map"];
        
        panelHTML += "<tr>";
        for(var property in object2) {
            panelHTML += "<th class=\"text-center  "+ sortedColumnDefinitionTDClassInfoMap[property] +" \">"+ object2[property]+"</th>";
        }
        panelHTML += "</tr><tbody>";
        //
        // at this point we know the source of data, and how it is expected to be sorted
        // first get the data
        var mnemosyneDataSortedArray = getMnemosyneTableData(dataSourcePointer, sortingParameter, sortingOrder);
        
        var mnemosyneDataSortedArrayMap = mnemosyneDataSortedArray["_map"];
        var dataDene;
        var dataDeneWords;
        var dataDeneWord;
        var columnDefinitionDataSourcePointer;
        for(var property in mnemosyneDataSortedArrayMap) {
            //
            //after every three panels 
            dataDene = mnemosyneDataSortedArrayMap[property];   
            dataDeneWords = dataDene.DeneWords;
            //
            // now get the column data sorce pointer in the right order
                object2 = sortedColumnDefinitionDataSourcePointerHashMap["_map"];
            panelHTML += "<tr>";
            for(var property in object2) {
                columnDefinitionDataSourcePointer = object2[property]; 
                tDClassInfo=sortedColumnDefinitionTDClassInfoMap[property];
                //
                // from here we just want the deneword part of the pointer, because it is the same to the name of the denewrd where the data is
                //
                var identity = identityFactory.createIdentityByPointer(columnDefinitionDataSourcePointer);
                for(k6=0;k6<dataDeneWords.length;k6++){
                    dataDeneWord = dataDeneWords[k6];
                    if(dataDeneWord.Name===identity.deneWordName){
                        panelHTML += "<td class=\"text-center "+ tDClassInfo +" \">"+ dataDeneWord.Value+"</td>";
                    }
                }
            }
            panelHTML += "</tr>";
            
        }
        
        panelHTML += "</tbody></table>";
        return panelHTML;
                
    }
}