class ActionEvaluationReport{

    constructor(){

    }

    process (){
        var sourceDataPointer = denes[0].DeneWords[0].Value;
        //var sourceDataPointerIdentity = identityFactory.createIdentityByPointer(sourceDataPointer);
        var actionDene = getDeneByIdentityPointer(sourceDataPointer);
        var actionName = actionDene.Name;
        
        // the sourceDataPointerIdentity contains something like: @Sento:Internal:Actuators:Turn Pump On 
        // note that this points to a dene,
        var actionCodonPointer = sourceDataPointer + ":" + "Codon";
        //var actionCodonPointerIdentity = identityFactory.createIdentityByPointer(actionCodonPointer);
        var codonName = getDeneWordByIdentityPointer(actionCodonPointer, DENEWORD_VALUE_ATTRIBUTE);
        
        // we need to construct the address of the processing dene based on the convention:
        // teleonomeName:Purpose:Actuator Logic Processing:CodonName + ActionName + Processing
        var processingDataPointer = "@" + teleonomeName + ":Purpose:Actuator Logic Processing:" + codonName + " " + actionName + " Processing" 
        console.log("processingDataPointer=" + processingDataPointer);
        //
        // the dene words in this dene have fixed names so get the values directly
        var actionProcessingResultPointer = processingDataPointer + ":" + DENEWORD_ACTION_PROCESSING_RESULT;
        //var actionProcessingResultIdentity = identityFactory.createIdentityByPointer(actionProcessingResultPointer);
        var actionProcessingResult = getDeneWordByIdentityPointer(actionProcessingResultPointer, DENEWORD_VALUE_ATTRIBUTE);
        
        var actionExpressionIdentityPointer = processingDataPointer + ":" + DENEWORD_ACTION_EXPRESSION;
        //var actionExpressionIdentity = identityFactory.createIdentityByPointer(actionExpressionIdentityPointer);
        var actionExpression = getDeneWordByIdentityPointer(actionExpressionIdentityPointer, DENEWORD_VALUE_ATTRIBUTE);
        
        
        var panelHTML = "<div class=\"col-lg-12 hidden-xs\">";
        panelHTML += "<div class=\"bs-component\">";
        panelHTML += "<div class=\"panel panel-default\">";
        panelHTML += " <div class=\"panel-heading\"><h4>Action Evaluation -" + actionName +"</h4></div>";
        panelHTML += "<div class=\"panel-body\">";
        panelHTML += "<h4>Result: <strong>" + actionProcessingResult +"</strong></h4>";
        panelHTML += "<h6>Expression: " + actionExpression+ "</h6><br>";
        panelHTML += "<table class=\"table table-stripped\">";
        panelHTML += "<tr><th>Condition</th><th>Result</th><th>Expression</th><th>Variables</th></tr>";
        //
        // now process the conditions data, to get this data, the logic is as follows
        // all the conditions denes are in the chain 
        //  "@" + teleonomeName + ":Purpose:Actuator Logic Processing:" + codonName + " " + actionName + " Processing" 
        //
        // and are of type Actuator Condition Processing
        // so loop over all the denes in the chain and get the type, if the type of a dene is Actuator Condition Processing
        // and the name of the dene begins with 
        var	processingDeneChainPointer = "@" + teleonomeName + ":Purpose:Actuator Logic Processing:";
        //var processingDeneChainIdentity = identityFactory.createIdentityByPointer(processingDeneChainPointer);
        var  processingDeneChain = getDeneChainByIdentityPointer(processingDeneChainPointer);
        
        var denePanelArray = processingDeneChain["Denes"];
        var processingDene;
        var processingDeneName="";
        var actuatorConditionDeneWords;
        var actuatorConditionDeneWord;
        var conditionExpression;
        var conditionName;
        var conditionResult;
        var variableData;
        var i32=0;
        var t1=false;
        var t2=false;
        var t3=false;
        for(i32=0;i32<denePanelArray.length;i32++){
            processingDene = denePanelArray[i32];
            processingDeneName = processingDene.Name;
            
            t1= processingDene.hasOwnProperty("Dene Type");
            t2= processingDene["Dene Type"]===DENE_TYPE_ACTUATOR_CONDITION_PROCESSING;
            t3=processingDeneName.startsWith(codonName + " " + actionName);
            
            if(t1 && t2 && t3){
                actuatorConditionDeneWords = processingDene["DeneWords"];
                variableData="";
                for(j2=0;j2<actuatorConditionDeneWords.length;j2++){
                    actuatorConditionDeneWord = actuatorConditionDeneWords[j2];
                    if(actuatorConditionDeneWord.Name ==DENEWORD_CONDITION_EXPRESSION){
                        conditionExpression = actuatorConditionDeneWord.Value;
                    }else if(actuatorConditionDeneWord.Name ==CONDITION_NAME){
                        conditionName = actuatorConditionDeneWord.Value;
                    }else if(actuatorConditionDeneWord.Name ==DENEWORD_CONDITION_PROCESSING_RESULT){
                        conditionResult = actuatorConditionDeneWord.Value;
                    }else if(actuatorConditionDeneWord.hasOwnProperty("DeneWord Type") && actuatorConditionDeneWord["DeneWord Type"]===DENEWORD_TYPE_EVALUATED_VARIABLE){
                        variableData = variableData.concat(actuatorConditionDeneWord.Name + "=" + actuatorConditionDeneWord.Value + "<br>");
                        
                    }	
                }
            
                panelHTML += "<tr><th>"+conditionName +"</th><th>"+ conditionResult +"</th><th>"+conditionExpression+"</th><th>"+variableData +"</th></tr>";				
            }
        }
        
        panelHTML += "</table>";
        return panelHTML;
    }
}