﻿// /// <reference path="knockout.d.ts" />
// /// <reference path="knockout.mapping.d.ts" />
// /// <reference path="require.d.ts" />

declare var ko;
declare var Prism;
declare var _;

class DemoViewModel {
    isHtml = ko.observable(false);
    htmlView = ko.observable("");
    htmlExpl = ko.observable("");
    htmlCode = ko.observable("");
    values = ko.observable("");
    defdemo = ko.observable();
    optionsText = ko.observable();
    urlstring = ko.observable();
    isSimpleJson = ko.observable(false);
    columns = ko.observableArray([]);
    rows = ko.observableArray([]);
    inProgress = ko.observable(false);
    chkForceJson = ko.observable(false);
    chkForceString = ko.observable(false);
    chkAllowFlatten = ko.observable(false);

    currentDemoCategory = ko.observable();
    demoCategories = ko.observableArray(['']);
    isDemoCategorySelected = ko.computed(() => {
        var category = this.currentDemoCategory();
        return category;
    });

    availableDemos = ko.observableArray();
    currentDemos = ko.computed(() => {
        var category = this.currentDemoCategory();

        return _.filter(this.availableDemos(), demo => demo.ControllerName === category);
    });

    constructor() {
        $.ajax("/Menu/Index", "GET").done(data => {
            var demos = data["Demos"];

            demos.forEach(demo => {
                if (_.indexOf(this.demoCategories(), demo.ControllerName) === -1) {
                    this.demoCategories.push(demo.ControllerName);
                }

                this.availableDemos.push(demo);
            });
        }).fail(() => {
            this.availableDemos.push("Failed to retreive demos");
        });

        var presenter: DemoViewModelPresenter = new DemoViewModelPresenter();
    }

    clickForceJson() {
        if (this.chkForceJson() === true) {
            this.chkForceString(false);
        }
        return true;
    }

    clickForceString() {
        if (this.chkForceString() == true) {
            this.chkForceJson(false);
        }
        return true;
    }


    runDemo(): void {
        $('body').addClass('showResult');
        var url = this.getDemoUrl();

        if (this.values() !== "") {
            url += "?" + this.values();
        }

        this.isHtml(false);
        this.isSimpleJson(false);
        this.inProgress(true);
        $.ajax(url, "GET").done(data => {
            this.inProgress(false);
            console.log(data);

            var jsonObj = data;

            if (this.chkForceJson() === false && (this.chkForceString() === true || typeof (data) === "string")) {
                this.htmlView(data);
                this.inProgress(false);
                this.isHtml(true);
                return;
            }

            if (data instanceof Array === false) {
                jsonObj = [data];
            }

            this.columns([]);
            this.rows([]);

            for (var i = 0; i < jsonObj.length; i++) {

                var item = jsonObj[i];
                var newItem = {};

                for (var key in item) {
                    if (i === 0)
                        this.columns.push(key);

                    if (typeof item[key] !== "object") {
                        newItem[key] = item[key];
                    } else {
                        if (this.chkAllowFlatten() === true) {
                            for (var deeperKey in item[key]) {
                                if (i === 0)
                                    this.columns.push(deeperKey);
                                if (typeof item[key][deeperKey] !== "object")
                                    newItem[deeperKey] = item[key][deeperKey];
                                else
                                    newItem[deeperKey] = JSON.stringify(item[key][deeperKey]);
                            }
                        } else {
                            newItem[key] = JSON.stringify(item[key]);
                        }
                    }
                }
                this.rows.push(newItem);
            }
            this.inProgress(false);
            this.isSimpleJson(true);
        }).fail((jqXHR, textStatus, errorThrown) => {
            this.htmlView('Error Status : ' + jqXHR.status + '<br>' + jqXHR.responseText);
            this.inProgress(false);
            this.isHtml(true);
        });
    }

    getCode(): void {
        $('body').removeClass('showResult');
        var demoUrl = this.getDemoUrl();
        $.ajax("/Menu/LoadCsFile?Filename=" + demoUrl, "GET").done(data => {
            console.log(data);
            this.htmlCode(data);
            Prism.highlightAll();
        });
        $.ajax("/Menu/LoadCsFile?Docname=" + demoUrl, "GET").done(data => {
            console.log(data);
            this.htmlExpl(data);
        });
    }

    genUrl(): void {
        var url = window.location.href.replace(/\/$/, "") + this.getDemoUrl();
        if (this.values() !== "") {
            url += "?" + this.values();
        }
        this.urlstring(url);
    }

    getDemoUrl(): string {
        var demo = this.defdemo();
        return "/" + demo.ControllerName + "/" + demo.DemoName;
    }

    availableDemoChangeEvent(): void {
        this.values("");
        this.genUrl();
        this.isHtml(false);
        this.isSimpleJson(false);
        this.getCode();
        this.chkForceString(false);
        this.chkForceJson(false);
        this.chkAllowFlatten(false);
    }

    valuesKeyPressEvent(data, event) {
        this.genUrl();
        return true;
    }

    openNewTab() {
        window.open(this.urlstring(), '_blank');
    }
}











