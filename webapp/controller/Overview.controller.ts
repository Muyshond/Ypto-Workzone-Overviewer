import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";

/**
 * @namespace com.yteria.workzoneoverviewer.controller
 */
export default class Overview extends Controller {

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {

 this.collectdata()
    }

    public collectdata(): void {
    console.log("Collecting data...");
    
    const oModel = new JSONModel();
    oModel.loadData("model/workzonedata.json");

    oModel.attachRequestCompleted(() => {
        console.log("Data loaded:", oModel.getData());
        this.getView()?.setModel(oModel);
    });
}

}

