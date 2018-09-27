class DeviceInfo{
    constructor(){
        
        localStorageManager.removeComponentInfo(LOCAL_STORAGE_CURRENT_VIEW_KEY);
        var currentViewObject ={};
        currentViewObject["SecundaryView"]="DeviceInfo";
        localStorageManager.setItem(LOCAL_STORAGE_CURRENT_VIEW_KEY, currentViewObject);
    }

    process(){
        var panelHtml='';

        

        return panelHtml;
    }
}