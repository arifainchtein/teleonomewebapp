function getDeneByIdentityPointer(identityPointer){
	var identity = identityFactory.createIdentityByPointer(identityPointer);
	var i3=0,j3=0,k3=0;
	for( i3=0;i3<nucleiJSONArray.length;i3++){
		if(nucleiJSONArray[i3]['Name']===identity.nucleusName){
			var deneChains = nucleiJSONArray[i3]['DeneChains'];
			for( j3=0;j3<deneChains.length;j3++){
				if(deneChains[j3]["Name"]===identity.deneChainName){
					var denes = deneChains[j3]["Denes"];
					for( k3=0;k3<denes.length;k3++){
						var dene = denes[k3];
						if(dene["Name"]===identity.deneName){
							return dene;
						}
					}
				}
			}
		}
	}
}

function getHumanInterfaceDeneChainsForVisualizer(){
	nucleiJSONArray = denomeJSONObject.Nuclei;
	//console.log("inside getHumanInterfaceDeneChains5=" + nucleiJSONArray.length);

	for( i=0;i<nucleiJSONArray.length;i++){
		//console.log("inside nuclei[i]=" +nucleiJSONArray[i].Name);
		if(nucleiJSONArray[i].Name === NUCLEI_HUMAN_INTERFACE){
			return nucleiJSONArray[i]["DeneChains"];
		}
	}
}





function getPathologyDenes(){
	var i13=0,j13=0,k13=0;
	nucleiJSONArray = denomeJSONObject.Nuclei;
	for( i13=0;i13<nucleiJSONArray.length;i13++){
		if(nucleiJSONArray[i13]['Name']===NUCLEI_PURPOSE){
			var deneChains = nucleiJSONArray[i13]['DeneChains'];
			for( j13=0;j13<deneChains.length;j13++){
				if(deneChains[j13]["Name"]===DENECHAIN_PATHOLOGY){
					var denes = deneChains[j13]["Denes"];
					return denes;
				}
			}
		}
	}
}

function getMnemosyneExogenousEventsByPointer(identitySwitchDeneChainPointer, denetype){
	var i13=0,j13=0,k13=0;
	nucleiJSONArray = denomeJSONObject.Nuclei;
	
	var exogenousLocationPointer = getDeneWordByIdentityPointer(identitySwitchDeneChainPointer, DENEWORD_VALUE_ATTRIBUTE);
	
	var exogenousLocationDeneChain = getDeneChainByIdentityPointer( exogenousLocationPointer);

	var identity = identityFactory.createIdentityByPointer(exogenousLocationPointer);
	var exogenousEventsDenes = [];
	var t1=false, t2=false;
	var dene;
	for( i13=0;i13<nucleiJSONArray.length;i13++){
		if(nucleiJSONArray[i13]['Name']===NUCLEI_MNEMOSYNE){
			var deneChains = nucleiJSONArray[i13]['DeneChains'];
			for( j13=0;j13<deneChains.length;j13++){
				//console.log("deneChains[j13].Name=" + deneChains[j13].Name + " identity.deneChainName=" + identity.deneChainName);
				if(deneChains[j13].Name === identity.deneChainName){
					var denes = deneChains[j13]["Denes"];
					for( k13=0;k13<denes.length;k13++){
						dene = denes[k13];
						t1= dene.hasOwnProperty("Dene Type");
						t2= dene["Dene Type"]===denetype;
						if(t1 && t2){
							exogenousEventsDenes.push(dene);
						}
					}
				}
			}
		}
	}
	return exogenousEventsDenes;
}

function getMnemosynePathologyDenes(){
	var i13=0,j13=0,k13=0;
	nucleiJSONArray = denomeJSONObject.Nuclei;
	
	var patPointer = "@" +teleonomeName + ":" + NUCLEI_INTERNAL + ":" +DENECHAIN_MEDULA + ":" + DENE_PATHOLOGY + ":" +MEDULA_PATHOLOGY_MNEMOSYNE_LOCATION;
	var medulaPathologyLocationPointer = getDeneWordByIdentityPointer(patPointer, DENEWORD_VALUE_ATTRIBUTE);
	
	var selectedPathologyDeneChain = getDeneChainByIdentityPointer( medulaPathologyLocationPointer);

	var identity = identityFactory.createIdentityByPointer(medulaPathologyLocationPointer);
	var mnemosynePathologyDenes = [];
	var t1=false, t2=false;
	var dene;
	for( i13=0;i13<nucleiJSONArray.length;i13++){
		if(nucleiJSONArray[i13]['Name']===NUCLEI_MNEMOSYNE){
			var deneChains = nucleiJSONArray[i13]['DeneChains'];
			for( j13=0;j13<deneChains.length;j13++){
				//console.log("deneChains[j13].Name=" + deneChains[j13].Name + " identity.deneChainName=" + identity.deneChainName);
				if(deneChains[j13].Name === identity.deneChainName){
					var denes = deneChains[j13]["Denes"];
					for( k13=0;k13<denes.length;k13++){
						dene = denes[k13];
						t1= dene.hasOwnProperty("Dene Type");
						t2= dene["Dene Type"]===DENE_PATHOLOGY;
						if(t1 && t2){
							mnemosynePathologyDenes.push(dene);
						}
					}
				}
			}
		}
	}
	return mnemosynePathologyDenes;
}


function getMnemosyneTableData(identityPointer, sortingParam, sortingOrder){
	var identity = identityFactory.createIdentityByPointer(identityPointer);
	var sortingParamIdentity = identityFactory.createIdentityByPointer(sortingParam);
	//
	//
	
	var i4=0,j4=0,k4=0,l4=0,k6=0;
	var deneWords;
	var deneWord;
	
	var sortingParamValue;
	var unsortedHashMap = new HashMap();
	for( i4=0;i4<nucleiJSONArray.length;i4++){
		//console.log("nucleiJSONArray=" + JSON.stringify(nucleiJSONArray[i4]));
		if(nucleiJSONArray[i4]['Name']===identity.nucleusName){
			var deneChains = nucleiJSONArray[i4]['DeneChains'];
			for( j4=0;j4<deneChains.length;j4++){
				if(deneChains[j4]["Name"]===identity.deneChainName){
					var denes = deneChains[j4]["Denes"];
					for( k4=0;k4<denes.length;k4++){
						var dene = denes[k4];
						if(dene["Name"]===identity.deneName){
							deneWords = dene.DeneWords;
							for(k6=0;k6<deneWords.length;k6++){
								deneWord = deneWords[k6];
								if(deneWord.Name===sortingParamIdentity.deneWordName){
									unsortedHashMap.put(deneWord.Value,dene);
								}
							}
						}
					}
				}
			}
		}
	}
	//
	// now sort them
	var sorted = sortHashMap(unsortedHashMap);
	return sorted;
}

function setDeneWordValueByIdentityPointer(identityPointer, value){
	var identity = identityFactory.createIdentityByPointer(identityPointer);
	var i4=0,j4=0,k4=0,l4=0;
	for( i4=0;i4<nucleiJSONArray.length;i4++){
		//console.log("nucleiJSONArray=" + JSON.stringify(nucleiJSONArray[i4]));
		if(nucleiJSONArray[i4]['Name']===identity.nucleusName){
			var deneChains = nucleiJSONArray[i4]['DeneChains'];
			for( j4=0;j4<deneChains.length;j4++){
				if(deneChains[j4]["Name"]===identity.deneChainName){
					var denes = deneChains[j4]["Denes"];
					for( k4=0;k4<denes.length;k4++){
						var dene = denes[k4];
						if(dene["Name"]===identity.deneName){
							var deneWords = dene['DeneWords'];
							for( l4=0;l4<deneWords.length;l4++){
								var deneWord = deneWords[l4];
								if(deneWord['Name']===identity.deneWordName){
									deneWord['Value']=value;
								}
							}
						}
					}
				}
			}
		}
	}
}

function getDeneWordByIdentityPointer(identityPointer, whatToBring){
	var identity = identityFactory.createIdentityByPointer(identityPointer);
	var i4=0,j4=0,k4=0,l4=0;
	for( i4=0;i4<nucleiJSONArray.length;i4++){
		//console.log("nucleiJSONArray=" + JSON.stringify(nucleiJSONArray[i4]));
		if(nucleiJSONArray[i4]['Name']===identity.nucleusName){
			var deneChains = nucleiJSONArray[i4]['DeneChains'];
			for( j4=0;j4<deneChains.length;j4++){
				if(deneChains[j4]["Name"]===identity.deneChainName){
					var denes = deneChains[j4]["Denes"];
					for( k4=0;k4<denes.length;k4++){
						var dene = denes[k4];
						if(dene["Name"]===identity.deneName){
							var deneWords = dene['DeneWords'];
							for( l4=0;l4<deneWords.length;l4++){
								var deneWord = deneWords[l4];
								if(deneWord['Name']===identity.deneWordName){
									if(whatToBring===COMPLETE){
										return deneWord;
									}else {
										return  deneWord[whatToBring];
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

function extractDeneWordValueByDeneWordTypeFromDeneChain(deneChainPanel, deneWordType){
	var denes = deneChainPanel["Denes"];
	var panelInPanelPosition=-1;
	var panelDataSourcePointer="";
	var deneWord, deneWords, dene;
	var j5=0,k5=0;
	var panelPositionInPanelHashMap = new HashMap();
	for(j5=0;j5<denes.length;j5++){
		dene=denes[j5];
		deneWords = dene["DeneWords"];
		panelInPanelPosition=-1;
		panelDataSourcePointer="";
		for(k5=0;k5<deneWords.length;k5++){
			deneWord = deneWords[k5];
			//
			// get the position and the type
			 if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===deneWordType){
				panelDataSourcePointer = deneWord["Value"];
			}
		}
	}
	return panelDataSourcePointer;
}

function getFormPrettyNameOrdered(deneChainPanel){
	var denes = deneChainPanel["Denes"];
	var panelInPanelPosition=-1;
	var prettyName="";
	var deneWord, deneWords, dene;
	var j6=0,k6=0;
	var panelPositionInPanelHashMap = new HashMap();
	var panelDataSourcePointer;
	for(j6=0;j6<denes.length;j6++){
		dene=denes[j6];
		deneWords = dene["DeneWords"];
		panelInPanelPosition=-1;
		panelDataSourcePointer="";
		for(k6=0;k6<deneWords.length;k6++){
			deneWord = deneWords[k6];
			//
			// get the position and the type
			if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_PANEL_IN_PANEL_POSITION){
				panelInPanelPosition = deneWord["Value"];
			}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_PANEL_DATA_DISPLAY_NAME){
				prettyName = deneWord["Value"];
			}
		}

		//
		// if the values were found store them in a hashmap
		//
		
		if(panelInPanelPosition!=-1 &&  prettyName!=""){
			panelPositionInPanelHashMap.put(panelInPanelPosition,prettyName);
		}

	}
	
	//
	// sort the hashmap by postion
	//
	var sorted= sortHashMap(panelPositionInPanelHashMap);
	var prettyNames = []; 
	var object = sorted["_map"];
	var prettyName;
	for(var property in object) {
		prettyName = object[property]; 
		prettyNames.push(prettyName);
	}
	return prettyNames;
}


function extraLowerNavInfo(deneChainPanel){
	var denes = deneChainPanel["Denes"];
	var pageInNavPosition=-1;
	var pageTitle="";
	var pageIncludeInNav=false;
	var deneWord, deneWords, dene;
	var j6=0,k6=0;
	var pagePositionHashMap = new HashMap();
	
	for(j6=0;j6<denes.length;j6++){
		dene=denes[j6];
		deneWords = dene["DeneWords"];
		pageInNavPosition=-1;
		pageIncludeInNav=false;
		pageTitle="";
		for(k6=0;k6<deneWords.length;k6++){
			deneWord = deneWords[k6];
			//
			// get the position and the type
			if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_HUMAN_INTERFACE_WEB_PAGE_PAGE_POSITION){
				pageInNavPosition = deneWord["Value"];
			}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_HUMAN_INTERFACE_WEB_PAGE_INCLUDE_IN_NAVIGATION){
				pageIncludeInNav = deneWord["Value"];
			}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_HUMAN_INTERFACE_WEB_PAGE_PAGE_TITLE){
				pageTitle = deneWord["Value"];
			}
		}

		//
		// if the values were found store them in a hashmap
		//
		
		if(pageIncludeInNav){
			pagePositionHashMap.put(pageInNavPosition,dene);
		}

	}
	
	//
	// sort the hashmap by postion
	//
	var sorted= sortHashMap(pagePositionHashMap);
	
	var returnText = ""; 
	var object = sorted["_map"];
	var glyphIcon;
	for(var property in object) {
		dene = object[property]; 
		
		deneWords = dene["DeneWords"];
		pageInNavPosition=-1;
		pageIncludeInNav=false;
		pageTitle="";
		for(k6=0;k6<deneWords.length;k6++){
			deneWord = deneWords[k6];
			//
			// get the position and the type
			if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_HUMAN_INTERFACE_WEB_PAGE_PAGE_POSITION){
				pageInNavPosition = deneWord["Value"];
			}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_HUMAN_INTERFACE_WEB_PAGE_PAGE_TITLE){
				pageTitle = deneWord["Value"];
			}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_HUMAN_INTERFACE_WEB_PAGE_GLYPH_ICON){
				glyphIcon = deneWord["Value"];
			}
		}
		returnText+="<div class=\"col-xs-2 text-center LowerNavFunction\">";
		returnText+="<a href=\"javascript:setPageToDisplay("+ pageInNavPosition+")\"><i class=\""+ glyphIcon +"\"></i><br>"+pageTitle+"</a>";
		returnText+="</div>";
		
	}

	return returnText;
}

function sortDenesInASingleValuePanel(deneChainPanel){
	var denes = deneChainPanel["Denes"];
	var panelInPanelPosition=-1;
	var panelDataSourcePointer="";
	var deneWord, deneWords, dene;
	var j6=0,k6=0;
	var panelPositionInPanelHashMap = new HashMap();
	
	for(j6=0;j6<denes.length;j6++){
		dene=denes[j6];
		deneWords = dene["DeneWords"];
		panelInPanelPosition=-1;
		panelDataSourcePointer="";
		for(k6=0;k6<deneWords.length;k6++){
			deneWord = deneWords[k6];
			//
			// get the position and the type
			if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_PANEL_IN_PANEL_POSITION){
				panelInPanelPosition = deneWord["Value"];
			}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER){
				panelDataSourcePointer = deneWord["Value"];
			}
		}

		//
		// if the values were found store them in a hashmap
		//
		
		if(panelInPanelPosition!=-1 &&  panelDataSourcePointer!=""){
			panelPositionInPanelHashMap.put(panelInPanelPosition,dene);
		}

	}
	
	//
	// sort the hashmap by postion
	//
	var sorted= sortHashMap(panelPositionInPanelHashMap);
	return sorted;
}

function getDeneWordMapByDeneWordName(dene){
	
	var deneWord,k6;
	var deneWordHashMap = new HashMap();
	var deneWords = dene["DeneWords"];
	
	for(k6=0;k6<deneWords.length;k6++){
		deneWord = deneWords[k6];
		deneWordHashMap.put(deneWord["Name"],deneWord);
		//
		// get the position and the type
		if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_PANEL_IN_PANEL_POSITION){
			panelInPanelPosition = deneWord["Value"];
		}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER){
			panelDataSourcePointer = deneWord["Value"];
		}
	}
	return deneWordHashMap;
}

	


function getDeneChainByIdentityPointer(identityPointer){
	var identity = identityFactory.createIdentityByPointer(identityPointer);
	var i3=0,j3=0,k3=0;
	for( i3=0;i3<nucleiJSONArray.length;i3++){
		if(nucleiJSONArray[i3]['Name']===identity.nucleusName){
			var deneChains = nucleiJSONArray[i3]['DeneChains'];
			for( j3=0;j3<deneChains.length;j3++){
				if(deneChains[j3]["Name"]===identity.deneChainName){
					return deneChains[j3];
				}
			}
		}
	}
}

function containsDeneWordByIdentityPointer(identityPointer){
	var identity = identityFactory.createIdentityByPointer(identityPointer);
	var i4=0,j4=0,k4=0,l4=0;
	var toReturn=false;
	for( i4=0;i4<nucleiJSONArray.length;i4++){
		//console.log("nucleiJSONArray=" + JSON.stringify(nucleiJSONArray[i4]));
		if(nucleiJSONArray[i4]['Name']===identity.nucleusName){
			var deneChains = nucleiJSONArray[i4]['DeneChains'];
			for( j4=0;j4<deneChains.length;j4++){
				if(deneChains[j4]["Name"]===identity.deneChainName){
					var denes = deneChains[j4]["Denes"];
					for( k4=0;k4<denes.length;k4++){
						var dene = denes[k4];
						if(dene["Name"]===identity.deneName){
							var deneWords = dene['DeneWords'];
							for( l4=0;l4<deneWords.length;l4++){
								var deneWord = deneWords[l4];
								if(deneWord['Name']===identity.deneWordName){
									toReturn=true;								
								}
							}
						}
					}
				}
			}
		}
	}
	return toReturn;
}

function deneHasDeneWordProperty(dene, propertyName){
	var deneWords = dene["DeneWords"];
	var l7=0;
	for( l7=0;l7<deneWords.length;l7++){
		var deneWord = deneWords[l7];
		if(deneWord["Name"]===propertyName){
			return true;
		}
	}
	return false;
}


function getDeneWordAttributeByDeneWordNameFromDene(controlParameterDene, deneWordName, whatToReturn){
	var deneWords = controlParameterDene["DeneWords"];
	var l7=0;
	for( l7=0;l7<deneWords.length;l7++){
		var deneWord = deneWords[l7];
		if(deneWord["Name"]===deneWordName){
			if(whatToReturn===COMPLETE){
				return  deneWord;
			}else if(whatToReturn===DENEWORD_VALUE_ATTRIBUTE){
				return  deneWord["Value"];
			}
		}
	}

	return "";
}
function getDeneWordAttributeByDeneWordTypeFromDene(controlParameterDene, deneWordType, whatToReturn){
	var deneWords = controlParameterDene["DeneWords"];
	var l7=0;
	for( l7=0;l7<deneWords.length;l7++){
		var deneWord = deneWords[l7];
		if(deneWord["DeneWord Type"]===deneWordType){
			if(whatToReturn===COMPLETE){
				return  deneWord;
			}else if(whatToReturn===DENEWORD_VALUE_ATTRIBUTE){
				return  deneWord["Value"];
			}
		}
	}
	return null;
}


function getAllDeneWordAttributeByDeneWordTypeFromDene(controlParameterDene, deneWordType, whatToReturn){
	var deneWords = controlParameterDene["DeneWords"];
	var toReturn = []; 
	var l7=0;
	for( l7=0;l7<deneWords.length;l7++){
		var deneWord = deneWords[l7];
		if(deneWord["DeneWord Type"]===deneWordType){
			if(whatToReturn===COMPLETE){
				toReturn.push(deneWord);
			}else if(whatToReturn===DENEWORD_VALUE_ATTRIBUTE){
				toReturn.push(deneWord["Value"]);
			}
		}
	}

	return toReturn;
}

