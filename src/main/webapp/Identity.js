var teleonomeName;
function IdentityFactory() {

    this.init= function(t){
      teleonomeName=t;  
    }

    this.createIdentityByPointer = function (identityPointer) {
        var identity = new Object;
        //
        // identity pointer looks like:
        //@Sunflower:Human Interface:Now Panel
        
        var tokens = identityPointer.split(":");
        identity.nucleusName="";
        identity.deneChainName="";
        identity.deneName="";
       identity.deneWordName="";
         teleonomeName=tokens[0];  
         if(teleonomeName.substring(0,1)=="@")teleonomeName=tokens[0].substring(1);
        if(tokens.length>1)identity.nucleusName=tokens[1];
        if(tokens.length>2)identity.deneChainName=tokens[2];
        if(tokens.length>3)identity.deneName=tokens[3];
        if(tokens.length>4)identity.deneWordName=tokens[4];
        return identity;
    }
    
    this.createIdentity = function (nucleus,denechain,dene,deneword) {
        var identity;
        identity.nucleusName=nucleus;
        identity.deneChainName=denechain;
        identity.deneName=dene;
       identity.deneWordName=deneword;
        return identity;
    }

this.createIdentity = function (nucleus,denechain,dene) {
        var identity;
        identity.nucleusName=nucleus;
        identity.deneChainName=denechain;
        identity.deneName=dene;
        return identity;
    }

this.createIdentity = function (nucleus,denechain) {
        var identity;
        identity.nucleusName=nucleus;
        identity.deneChainName=denechain;
        return identity;
    }

    this.createIdentity = function (nucleus) {
        var identity;
        identity.nucleusName=nucleus;
        return identity;
    }
}
 
