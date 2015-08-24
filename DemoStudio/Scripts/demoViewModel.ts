﻿// /// <reference path="knockout.d.ts" />
// /// <reference path="knockout.mapping.d.ts" />
// /// <reference path="require.d.ts" />


declare var ko;
declare var availableDemos;

class demoViewModel {
    isHtml = ko.observable(true);
    htmlView = ko.observable("x");
    availableDemos = ko.observableArray(["Choose Demo..."]);
    values = ko.observable("");
    defdemo = ko.observable();
    optionsText = ko.observable();
    urlstring = ko.observable();

    
    isSimpleJson = ko.observable(true);

    /*columns = ko.observableArray([{ header: "A", dataMember: "B" }, { header: "C", dataMember: "D" }]);
    rows = ko.observableArray([{ header: "A", dataMember: "B" }, { header: "C", dataMember: "D" }]);*/
    columns = ko.observableArray([]);
    rows = ko.observableArray([]);
    

    constructor() {
        var selfAvailableDemos = this.availableDemos;
        $.ajax("/Menu/Index", "GET").done(data => {
            var listOfControllers = data["ListOfControllers"];
            
            listOfControllers.forEach(function(entry) {
                selfAvailableDemos.push(entry);
            });
        }).fail(() => {
            selfAvailableDemos.push("Failed to retreive demos");
        });
    }
}



function runDemo(): void {
    var url = this.defdemo();    

    if (this.values() !== "") {
        url += "?" + this.values();
    }

    
    $.ajax(url, "GET").done(data => {
        console.log(data);

        var jsonObj = data;

        if (typeof (data) === "string") {
            this.htmlView(data);
            return;
        }


        if (data instanceof Array === false) {
            jsonObj = [data];
        }
        

        //var newArr = [];
        this.columns([]);
        this.rows([]);
        for (var i = 0; i < jsonObj.length; i++) {
            var item = jsonObj[i];

            var newItem = {};
            // var itemsToBeCreated = []; // holds new items that need to be created

            for (var key in item) {
                if (i === 0)
                    this.columns.push(key);

                if (typeof item[key] !== "object") {
                    newItem[key] = item[key]; // copy the new item
                } else {
                    for (var deeperKey in item[key]) {
                        this.columns.push(deeperKey);
                        // var obj = {};
                        // obj[deeperKey] = item[key][deeperKey];
                        // itemsToBeCreated.push(obj);
                        newItem[deeperKey] = item[key][deeperKey];
                    }
                }
            }

            this.rows.push(newItem);

            //for (var y = 0; y < itemsToBeCreated.length; y++) {
            //    this.rows.push(jQuery.extend(itemsToBeCreated[y], newItem));
            //}
        }





    });


}




function genUrl(): void {
    
    var url = window.location.href.replace(/\/$/, "") + this.defdemo();
    if (this.values() !== "") {
        url += "?" + this.values();
    }
    this.urlstring(url);
}








