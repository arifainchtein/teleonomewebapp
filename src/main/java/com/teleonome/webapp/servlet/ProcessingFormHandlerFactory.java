package com.teleonome.webapp.servlet;


import java.util.*;
import javax.servlet.ServletContext;
import java.lang.reflect.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.teleonome.framework.exception.ServletProcessingException;

public class ProcessingFormHandlerFactory extends Object {

			
    public ProcessingFormHandlerFactory() {
    }

    /**
     * Creates any object given by its class.
     * @param aClass. 
     * @param AppServer the AppServer
     * @return BasePage The empty persistent object.
     */
    public static ProcessingFormHandler createProcessingFormHandler(String className, HttpServletRequest req, HttpServletResponse res,ServletContext servletContext) throws ServletProcessingException{ 
           
        boolean objectCreated = false;       
        ProcessingFormHandler processingFormHandler = null;
        
        try {
		    Class aClass = Class.forName(className);
            //get the constructors that belong to the class
            Constructor[] constructors = aClass.getConstructors();
            for ( int i=0; i < constructors.length; i++ ) {
                Class[] parameterTypes = constructors[i].getParameterTypes();
                if (parameterTypes.length == 3){
                    Object[] anArray = { req,res,servletContext };
                    processingFormHandler = (ProcessingFormHandler) constructors[i].newInstance(anArray);
                    objectCreated = true;
                    break;
                }    
            }    
        }catch ( InstantiationException e ) {                                                                                                                                                    
            Hashtable info = new Hashtable();
            info.put("Exception Thrown","InstantiationException");
            info.put("Exception",e.getMessage());
            info.put("In Method","createObject");
            info.put("In Class","ProcessingFormHandlerFactory 1");
            throw new ServletProcessingException(info);
        }catch ( IllegalAccessException e ) {                                                                                                                                                    
            Hashtable info = new Hashtable();
            info.put("Exception Thrown","IllegalAccessException");
            info.put("Exception",e.getMessage());
            info.put("In Method","createObject");
            info.put("In Class","ProcessingFormHandlerFactory 2");
            throw new ServletProcessingException(info);        
        }catch ( InvocationTargetException e ) {                                                                                                                                                    
            Hashtable info = new Hashtable();
            info.put("Exception Thrown","InvocationTargetException");
            info.put("Exception",e.getMessage());
            info.put("In Method","createObject");
            info.put("In Class","ProcessingFormHandlerFactory 3" );
            throw new ServletProcessingException(info);        
        }catch ( ClassNotFoundException e ) {                                                                                                                                                    
            Hashtable info = new Hashtable();
            info.put("Exception Thrown","ClassNotFoundException");
            info.put("Exception",e.getMessage());
            info.put("In Method","createObject");
            info.put("In Class","ProcessingFormHandlerFactory 4 " + className);
            throw new ServletProcessingException(info);
        }
       
        if (objectCreated == false) {
            Hashtable info = new Hashtable();
            info.put("Exception Thrown","Object Not Created");
            info.put("In Method","createObject");
            info.put("In Class","ProcessingFormHandlerFactory 5");
            throw new ServletProcessingException(info);        
        }                     
       return processingFormHandler;
    }   
}
