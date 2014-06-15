var defaults={
    address: {
        singleInput:  false // [true|false] single input for address details vs multiple separate inputs for address, state, postcode etc
        searchType:  "BOTH" //[Residential|Business|BOTH]
        eventTrigger:  "keypress" //[keypress|click]
        inputs: {
          primaryName: //string or object reference - optional
          address: //string or object reference - mandatory
          phoneNumber: //string or object reference - optional
          postcode: //string or object reference -optional if singleInput = true
          state: //string or object reference -optional if singleInput = true
          suburb: //string or object reference -optional if singleInput = true
          submit: //string or object reference to submit button - optional, works with eventTrigger: click
        },
        outputs: {
          //All outputs are optional
          //Outputs match the attributes of the returned address object. These include
          secondaryName: // require primaryName or phone number input
          primaryName:  // require primaryName  or phone number input
          barcode:  
          formattedAddress:  
          inPrintedWPBook:   //appears in printed WP
          phoneNumber: //require primaryName input or phone number input
          postal:   //includes data from Australia Post database
          postcode:  
          state:  
          streetName:  
          streetNumber:  
          streetType:  
          suburb:  
          whitePages:  //includes data from WP database
          geocodeLat:  
          geocodeLong:  
        },
        ajax: {  //these urls can be the same - depends on your bridge code
          suggestName: //url to service
          suggestAddress: //url to service
          selectAddress: //url to service
        }
      },
    mobile: {
        inputs: {
          number: //string or object reference
          submit: //string or object reference to submit button - optional, works with eventTrigger: click
        },
        outputs: {
          //All outputs are optional
          //Outputs match the attributes of the returned address object. These include
          cleanNumber: 
          number: 
          result: 
        },
        ajax: //url to service
        eventTrigger: "blur" // [blur|click] event trigger
      },
    email: {
        inputs: {
          email: //string or object reference
          submit: //string or object reference to submit button - optional, works with eventTrigger: click
        },
        outputs: {
          //All outputs are optional
          //Outputs match the attributes of the returned address object. These include
          cleanEmail:
          email:
          doesDomainExist:
          doesDomainServeMail:
          doesEmailExist:
          isDomainSyntaxValid:
          isEmailSyntaxValid:

        },
        ajax: //url to service
        eventTrigger: "blur"  //[blur|click]
      },
      config: {
        delay: 500,  //delay in microseconds after keypress event before keypress action fires
        debug: false,
        ajaxRequest: "GET" //[POST,GET],
        reset: "#resetButton"  ////string or object reference to element where click event clears form and resets UI
    }
};