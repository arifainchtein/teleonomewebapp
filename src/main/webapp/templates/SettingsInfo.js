class SettingsInfo{
	
	constructor(){

    }

    process(){
        var panelHtml='';
//  var currentIdentityModePointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_TYPE_VITAL + ":" +DENEWORD_TYPE_CURRENT_IDENTITY_MODE;
				
        var pointers =[
            "@"+ teleonomeName + + ":" + NUCLEI_INTERNAL + ":" +DENECHAIN_DESCRIPTIVE + ":" + COMPUTER_INFO,
            "@"+ teleonomeName + + ":" + NUCLEI_INTERNAL + ":" +DENECHAIN_DESCRIPTIVE + ":" + DENE_USB_DEVICES,
            "@"+ teleonomeName + + ":" + NUCLEI_INTERNAL + ":" +DENECHAIN_DESCRIPTIVE + ":" + DENE_PROCESSOR_INFO,
            "@"+ teleonomeName + + ":" + NUCLEI_INTERNAL + ":" +DENECHAIN_DESCRIPTIVE + ":" + COMPUTER_INFO
        ]
        for(var u=0;u<pointers.length;u++){
            DeneToTable aDeneToTable = new DeneToTable();
            panelHTML += aDeneToTable.process(pointers[u]);
        }
        

        return panelHtml;
    }

    
    
}