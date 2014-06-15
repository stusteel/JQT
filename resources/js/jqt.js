/*
 * jQT 1.0-rc1
 * A jQuery plugin for TotalCheck
 * http://www.totalcheck.com.au/
 *
 * Copyright (c) 2013 Sensis

 * Developer: Stuart Steel
 * stuart.steel@sensis.com.au
 *
 * Licensed same as jquery - under the terms of either the MIT License or the GPL Version 2 License
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * $Date: 2013-03-18   $
 * $Revision: 6 $
 */



"use strict";




(function($, window) {
	var settings,self,toolTipField,addressField,suggestedAddresses,selectedAddress;
	//publishing templates
	document.write("<script type='text/ejs' id='nameSuggest'><% for(var i=0; i < names.length; i++){ %><div class='jqt-suggestedItem jqt-suggestedName'><%=names[i] %></div><%} %></script>");
	document.write("<script type='text/ejs' id='addressSuggest'><% for(var i=0; i < resultList.length; i++){ %><div class='jqt-suggestedItem jqt-suggestedAddress jqt-wp-<%=resultList[i].whitePages %>' attr-index='<%=resultList[i].index %>'><%=resultList[i].formattedAddress %></div><%} %></script>");
	document.write("<script type='text/ejs' id='subAddressSuggest'><% for(var i=0; i < detailList.length; i++){ %><div class='jqt-suggestedItem jqt-suggestedSubAddress' attr-index='<%=i %>'><%=detailList[i].formattedAddress %></div><%} %></script>");
	
	var request_n=0;
	var Settings = function() {
		this.defaults={
			address: {
				singleInput: false, // //single input for address details vs multiple separate inputs for address, state, postcode etc
				searchType: "BOTH", //[Residential|Business|BOTH]
				eventTrigger: "keypress"  //[keypress|click]
		},
		mobile: {
			eventTrigger: "blur"  //[blur|click]
		},
		email: {
			eventTrigger: "blur"  //[blur|click]
		},
		config: {
			delay: 500,
			debug: false,
			ajaxRequest: "GET" //[POST,GET]
		}
		};
		this.configure=function(options) {
			var settings={
				address: "",
				mobile: "",
				email: "",
				config: ""
			};
			settings.address=$.extend(this.defaults.address,options.address);
			settings.mobile=$.extend(this.defaults.mobile,options.mobile);
			settings.email=$.extend(this.defaults.email,options.email);
			settings.config=$.extend(this.defaults.config,options.config);
			return settings;
		};
	};
	var methods = {
		init: function(options) {

			var ver=$().jquery.replace(/^(.*)\.\d+$/,"$1");
			if (ver < 1.7 ) {
				window.alert("jQT requires jQuery Version 1.7 or greater.\nCurrent version is "+$().jquery);
				return;
			}
			//merge options with defaults
			this.settings = new Settings().configure(options);
			this.$ajax = (this.settings.config.ajaxRequest.toLowerCase() === "get")? $.get : $.post ;
			//run event binding
			
			this.jqt("eventBinding",this);
			return this;
		},

		eventBinding: function($instance) {
			//clear ajax suggestions
			$(window.document).click(function(){
				$("#jqt-autocomplete").remove();
				//$instance.jqt("deleteKeyPressEvents",$instance);
			});
			//clear ajax suggestions
			$instance.find(":text").on("focus.jqt",$.proxy( function(e){
				$("#jqt-autocomplete").remove();
				this.jqt("deleteKeyPressEvents",$instance);
				toolTipField=e.target.id;
			}, $instance));

			//mouseover events on ajaxlists
			$instance.on("mouseenter.jqt",".jqt-suggestedItem",$.proxy( function(e){
				this.find(".jqt-active").removeClass("jqt-active");
				$(e.target).addClass("jqt-active");
			}, $instance));
			//reset button
			if ($instance.settings.config.reset) {
				$($instance.settings.config.reset).click($.proxy( function(e){
					this.jqt("reset",this);
				}, $instance));
			}
			//address events
			if ($instance.settings.address && $instance.settings.address.inputs) {
				//set position: relative;
				$.each($instance.settings.address.inputs,function(k,v) {
					var el,p,sleeve;
					el=$(v).attr("autocomplete","off");
					if (el.length === 0) {
						console.error("element "+this+" not found");
						return;
					}
					p=el.parent();
					if (p.length>0) {
						if (p[0].nodeName === "TD") {
							p.append("<div style='position: relative;' />");
							sleeve=p.children("div").last();
							sleeve.append( p.children().not(sleeve) );
						} else {
							p.css("position", "relative");
						}
					}
					
				});
				//name suggest binding
				if ($instance.settings.address.inputs.primaryName) {
					$($instance.settings.address.inputs.primaryName).keyup(function(evt){
						if (evt.keyCode === 37 || evt.keyCode === 38 || evt.keyCode === 39 || evt.keyCode === 40 || evt.keyCode === 13) {
							return;
						}
						var input=this;
						if (input.value.length>2) {
							$instance.delay($instance.settings.config.delay).queue(function(){  $instance.jqt("suggestName",input,$instance); $instance.clearQueue(); });
						}
					});
				}
					
				//name select binding
				$instance.on("click.jqt",".jqt-suggestedName",function(){
					$instance.jqt("selectName",this,$instance);
				});
				//address suggest binding
				var addressString="";
				$.each($instance.settings.address.inputs,function(k,v){
					if (k === "primaryName" || k === "submit") {
						return;
					}
					if (addressString !=="" ) {
						addressString+=",";
					}
					addressString+=v;
				});

				if ($instance.settings.address.eventTrigger==="keypress") { //keypress autosuggest - default
					$(addressString).keypress(function(evt){
						if (evt.keyCode === 37 || evt.keyCode === 38 || evt.keyCode === 39 || evt.keyCode === 40 || evt.keyCode === 13) {
							return;
						}
						var input=this;
						var minKeys = ( "#"+input.id === $instance.settings.address.inputs.phonenumber)? 5 : 2;
						if (input.value.length>minKeys) {
							//console.log($instance.settings);
							$instance.delay($instance.settings.config.delay).queue(function(){  $instance.jqt("suggestAddress",input,$instance); $instance.clearQueue(); });
						}
					});
				} else if ($instance.settings.address.eventTrigger==="click" && $instance.settings.address.inputs.submit ) { //submit button
					$($instance.settings.address.inputs.submit).click(function(evt){
						var input=($instance.settings.address.inputs.submitTarget)? $($instance.settings.address.inputs.submitTarget) : this;
						$instance.jqt("suggestAddress",input,$instance);
					});
				}
				
				//address select binding
				$instance.on("click.jqt",".jqt-suggestedAddress",function(){
					$instance.jqt("selectAddress",this,$instance);
				});
				//subaddress select binding
				$instance.on("click.jqt",".jqt-suggestedSubAddress",function(){
					$instance.jqt("selectSubAddress",this,$instance);
				});
			}

			//mobile events
			if ($instance.settings.mobile && $instance.settings.mobile.inputs && $instance.settings.mobile.inputs.number) {
				if ($instance.settings.mobile.eventTrigger === "blur") {
					$($instance.settings.mobile.inputs.number).blur(function(){
						$instance.jqt("validateMobile",$instance);
					});
				} else if ($instance.settings.mobile.eventTrigger === "click" && $instance.settings.mobile.inputs.submit) {
					$( $instance.settings.mobile.inputs.submit ).click(function(){
						$instance.jqt("validateMobile",$instance);
					});
				}

			}
			//email events
			if ($instance.settings.email && $instance.settings.email.inputs && $instance.settings.email.inputs.email) {
				
				if ($instance.settings.email.eventTrigger === "blur") {
					$($instance.settings.email.inputs.email).blur(function(){
						$instance.jqt("validateEmail",$instance);
					});
				} else if ($instance.settings.email.eventTrigger === "click" && $instance.settings.email.inputs.submit) {
					$( $instance.settings.email.inputs.submit ).click(function(){
						$instance.jqt("validateEmail",$instance);
					});
				}
			}
		},


		suggestName: function(el,$instance) {
			request_n++;
			var url=$instance.settings.address.ajax.suggestName;
			var requestData,surname,search,nameField,nameArray={names:[]};
			nameField=$(el);
			nameField.val( nameField.val().replace(/\d/g,"") ).addClass("jqt-ajaxLoading");
			surname=nameField.val();
			search="full details"; //[DEV] - fix this later.
			requestData={'surname': surname, 'search': search, 'request_n': request_n, action: "SuggestName"};

			//requestName event
			$instance.trigger({
				type: "preRequest.jqt",
				request: requestData,
				instance: $instance
			});

			$instance.$ajax(url,requestData,function(response) {
					if (response.request_n<request_n) return;
					var $response=response["return"];
					if ($response) {
						$instance.trigger({
							type: "namesSuggested.jqt",
							request: requestData,
							response: $response,
							instance: $instance
						});
						if (typeof totalcheck == "string") {
							nameArray.names.push($response);
						} else {
							$.each($response, function(){
								nameArray.names.push(this);
							});
						}
						$instance.jqt("autoComplete",$instance.settings.address.outputs.primaryName, nameArray, "nameSuggest");
						$instance.trigger({
							type: "namesPublished.jqt",
							request: requestData,
							response: $response,
							instance: $instance
						});
					} else {
						$instance.find("input.jqt-ajaxLoading").removeClass("jqt-ajaxLoading");
					}
			},"json");
				
		},

		selectName: function(el,$instance) {
			$($instance.settings.address.inputs.primaryName).val($(el).text());
			/*if ($instance.settings.address.inputs.address) {
				$($instance.settings.address.inputs.address).focus();
			}*/
			$instance.trigger({
				type: "nameSelected.jqt",
				el: el,
				instance: $instance
			});
		},

		suggestAddress: function(el,$instance) {
			var val;
			request_n++;
			var url=$instance.settings.address.ajax.suggestAddress;
			addressField=$(el);
			//rewrite this line
			//var data=$instance.serialize();
			//
			var requestData={
				searchType: $instance.settings.address.searchType,
				singleInput: $instance.settings.address.singleInput,
				request_n: request_n,
				action: "SuggestAddress"
			};
			$.each($instance.settings.address.inputs,function(k,v) {
				val=$(v).val();
				if ( !(val=== null  || val=== undefined) ) requestData[k] = val;
			});
			
			$(el).addClass("jqt-ajaxLoading");
			$instance.trigger({
				type: "preRequest.jqt",
				request: requestData,
				instance: $instance
			});
			$instance.$ajax(url,requestData,function(response) {
				if (response.request_n<request_n) return;
				var $response=response["return"];
				if ($response && $response.resultList) {
					if ($response.resultStatus == 1) {
						suggestedAddresses=$response;
						$instance.trigger({
							type: "addressesSuggested.jqt",
							request: requestData,
							response: $response,
							instance: $instance
						});
						if ($response.resultList.formattedAddress) {  //single result returned
							$instance.jqt("autoComplete",addressField,{resultList: [$response.resultList]},"addressSuggest");
							suggestedAddresses.resultList= [$response.resultList];
						} else { //multiple returns
							$instance.jqt("autoComplete",addressField,$response,"addressSuggest");
						}
						$instance.trigger({
							type: "addressesPublished.jqt",
							request: requestData,
							response: $response,
							instance: $instance
						});
					} else if ($response.resultStatus == 3) {
						$instance.find("input.jqt-ajaxLoading").removeClass("jqt-ajaxLoading");
					}
				}  else if ($response && $response.resultStatus == 2) {
					//statusUpdate("<strong>No matching results:</strong> Please refine your search.");
					$instance.find("input.jqt-ajaxLoading").removeClass("jqt-ajaxLoading");
				}  else if ($response && $response.resultStatus == 3) {
					//statusUpdate("<strong>Too many matching results:</strong> Please refine your search.");
					$instance.find("input.jqt-ajaxLoading").removeClass("jqt-ajaxLoading");
				}
			},"json");
		},

		selectAddress: function(el,$instance) {
			var val,url, selected, requestData;
			$.each($instance.settings.address.inputs,function(){
				$(this).addClass("jqt-ajaxLoading");
			});
			url=$instance.settings.address.ajax.selectAddress;
			if (suggestedAddresses && suggestedAddresses.resultList && $(el).attr("attr-index") > 0) {
				selected=suggestedAddresses.resultList[ $(el).attr("attr-index") ];
			} else {
				selected={
					formattedAddress: "",
					index: 0,
					whitePages: false,
					postal: true
				};
			}
			requestData={
				formattedAddress: selected.formattedAddress,
				searchType: $instance.settings.address.searchType,
				singleInput: $instance.settings.address.singleInput,
				index: selected.index,
				whitePages: selected.whitePages,
				postal: selected.postal,
				action: "SelectAddress"
			};
			$.each($instance.settings.address.inputs,function(k,v) {
				val=$(v).val();
				if ( !(val=== null  || val=== undefined) ) requestData[k] = val;
			});
			$instance.trigger({
				type: "preRequest.jqt",
				el: el,
				request: requestData,
				instance: $instance
			});
			$("#jqt-autocomplete").remove();
			$instance.jqt("deleteKeyPressEvents",$instance);
			$instance.$ajax(url,requestData,function(response) {
					$instance.find("input.jqt-ajaxLoading").removeClass("jqt-ajaxLoading");
					var $response=response["return"];
					if ( $response && $response.resultStatus == 1 ) {
						$instance.trigger({
							type: "addressSupplied.jqt",
							request: requestData,
							response: $response,
							instance: $instance
						});
						selectedAddress=$response;
						if ($response.detailList && $response.detailList.length > 1 ) { //display sub addresses
							//publish sub-addresses for user selection
							$instance.jqt("autoComplete",addressField,$response,"subAddressSuggest");
							$instance.trigger({
								type: "subAddressesPublished.jqt",
								request: requestData,
								response: $response,
								instance: $instance
							});
						} else { //no sub addresses - populate form
							$instance.jqt("publishAddress",$response,$instance);
						}
					} else if ($response && $response.resultStatus == 2) {
						console.log("No matching results");
						//No matching results
					}  else if ($response && $response.resultStatus == 3) {
						console.log("too many matching results");
						//Too many matching results
					} else if ($response && $response.resultStatus == 4) {
						
						$instance.trigger({
								type: "addressCheckFails.jqt",
								request: requestData,
								response: $response,
								instance: $instance
							});
						console.log("request mismatch");
						//Too many matching results
					}
			},"json");
		},
		selectSubAddress: function(el,$instance) {
			var subaddress=$.extend(selectedAddress,selectedAddress.detailList[ $(el).attr("attr-index") ] );
			$instance.trigger({
				type: "subAddressSelected.jqt",
				el: el,
				address: subaddress,
				instance: $instance
			});
			$instance.jqt("publishAddress",subaddress,$instance);
		},

		validateEmail: function($instance) {
			var url=$instance.settings.email.ajax;
			var requestData,email;
			email=$( $instance.settings.email.inputs.email ).val();
			if (email === "") {
				return;
			}
			requestData={email: email,action: "ValidateEmail" };
			$instance.trigger({
				type: "preRequest.jqt",
				request: requestData,
				instance: $instance
			});
			$( $instance.settings.email.inputs.email ).addClass("jqt-ajaxLoading");
			$instance.$ajax(url,requestData,function(response) {
				var $response=response["return"];
				if ($response) {
					if ($response.doesEmailExist && $response.cleanEmail) {
						//$instance.jqt("publishDetail",$instance.settings.email.output,$response.cleanEmail);
						if ($instance.settings.email.outputs) {
							$.each($instance.settings.email.outputs,function(k,v){
								$instance.jqt("publishDetail",$instance.settings.email.outputs[k],$response[k]);
							});
						}
						$instance.trigger({
							type: "emailValidated.jqt",
							response: $response,
							instance: $instance
						});
					} else {
						$instance.trigger({
							type: "emailFailed.jqt",
							response: $response,
							instance: $instance
						});
					}
					$instance.trigger({
						type: "emailTested.jqt",
						response: $response,
						instance: $instance
					});
					$instance.find(".jqt-ajaxLoading").removeClass("jqt-ajaxLoading");
				}
			},"json");
		},

		validateMobile: function($instance) {
			var url=$instance.settings.mobile.ajax;
			var requestData,mobile;
			mobile=$( $instance.settings.mobile.inputs.number ).val();
			if (mobile === "") {
				return;
			}
			requestData={number: mobile, action: "ValidateMobile" };
			$instance.trigger({
				type: "preRequest.jqt",
				request: requestData,
				instance: $instance
			});
			$($instance.settings.mobile.inputs.number).addClass("jqt-ajaxLoading");
			$instance.$ajax(url,requestData,function(response) {
				var $response=response["return"];
					if ($response) {
						if ($response.response && $response.cleanNumber) {
							if ($instance.settings.mobile.outputs) {
								$.each($instance.settings.mobile.outputs,function(k,v){
									$instance.jqt("publishDetail",$instance.settings.mobile.outputs[k],$response[k]);
								});
							}
							$instance.trigger({
								type: "mobileValidated.jqt",
								response: $response,
								instance: $instance
							});
						} else {
							$instance.trigger({
								type: "mobileFailed.jqt",
								response: $response,
								instance: $instance
							});
						}
						$instance.trigger({
							type: "mobileTested.jqt",
							response: $response,
							instance: $instance
						});
						$instance.find(".jqt-ajaxLoading").removeClass("jqt-ajaxLoading");
					}
			},"json");
		},

		publishAddress: function($address,$instance) {
			//creating appropriate address property
			var address="";
			if ($address.subPremise) {
				address+=$address.subPremise+", ";
			}
			if ($address.streetNumber) {
				address+=$address.streetNumber+" ";
			}
			if ($address.streetName) {
				address+=$address.streetName+" ";
			}
			if ($address.streetType) {
				address+=$address.streetType;
			}
			$address.address=address;

			$.each($instance.settings.address.outputs,function(k,v){
				$instance.jqt("publishDetail",v,$address[k]);
			});
			$instance.trigger({
				type: "addressPublished.jqt",
				address: $address,
				instance: $instance
			});
		},

		publishEmail: function() {},

		publishMobile: function() {},

		publishDetail: function(el,val) {
			var node=$(el);
			if (node.length===1) {
				if (node[0].type) {
					node.val(val);
				} else {
					node.html(val);
				}
			}
		},

		autoComplete: function(target,data,template) {
			//console.warn(this);
			var $target,html,datarow,reg;
			$("#jqt-autocomplete").remove();
			this.jqt("deleteKeyPressEvents",this);
			this.find(".jqt-ajaxLoading").removeClass("jqt-ajaxLoading");
			this.find(".jqt-active").removeClass("jqt-active");
			$target=$(target);
			var targetdiv=$target.parent().addClass("jqt-active");
			targetdiv.append("<div id='jqt-autocomplete'></div>");
			$("#jqt-autocomplete").css("left",$target.position().left).append(template,data).find(".jqt-suggestedItem").eq(0).addClass("jqt-active");
			this.jqt("setKeyPressEvents",this);
			this.trigger({
				type: "autoComplete.jqt",
				data: data,
				instance: this
			});
		},

		setKeyPressEvents: function($instance) {
			$instance.on("keydown.jqt-kp",function(evt){
				var current,next,prev;
				if (evt.keyCode === 38) { //arrow up
					current=$("#jqt-autocomplete .jqt-active");
					prev=current.prev();
					if (prev.length>0) {
						prev.addClass("jqt-active");
						current.removeClass("jqt-active");
						$instance.jqt("scrollActiveOption",prev);
						return false;
					}

				} else if (evt.keyCode === 40) { //arrow down
					current=$("#jqt-autocomplete .jqt-active");
					next=current.next();
					if (next.length>0) {
						next.addClass("jqt-active");
						current.removeClass("jqt-active");
						$instance.jqt("scrollActiveOption",next);
						return false;
					}

				} else if (evt.keyCode === 13) { //enter
					current=$("#jqt-autocomplete .jqt-active");
					if (current.length>0) {
						current.trigger("click");
						return false;
					}
				}
			});
		},

		deleteKeyPressEvents: function($instance) {
			//console.log($instance);
			$instance.off("keydown.jqt-kp");
		},

		scrollActiveOption: function(el) {
			var p,pH,elH,pS,elT;
			p=el.parent(); //parent container
			pH=p.height();	//height of parent
			pS=p.scrollTop();	//scrollTop of parent
			elT=el.position().top;	//position of selected element relative to parent
			elH=el.height();	//height of selected element
			if ( (elT+0.5*elH) > pH ) { //scroll down
				p.scrollTop(elT+0.5*elH+pS-0.5*pH);
			} else if (elT< 0 ) { //scroll up
				p.scrollTop(p.scrollTop() - p.height()*0.5 -  0.5*elH );
			}
		},

		reset: function($instance) {
			$("#jqt-autocomplete").remove();
			if ($instance.settings.address !== undefined && $instance.settings.address.outputs !== undefined) {
				$.each($instance.settings.address.outputs, function(k,v){
					$instance.jqt("publishDetail",v,"",$instance);
				});
			}
		},

		ajaxFailure: function(response){
			$(".jqt-ajaxLoading").removeClass("jqt-ajaxLoading");
			console.error(response);
		},

		error: function() {}


	};

	$.fn.jqt = function(method) {
		// Method calling logic
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.jqt' );
		}

	};

	


})(jQuery, window);