import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import TreeTable from "sap/ui/table/TreeTable";
import RowBinding from "sap/ui/model/RowBinding";
import { SearchField$SearchEvent } from "sap/m/SearchField";
import { Select$ChangeEvent } from "sap/m/Select";

/**
 * @namespace com.yteria.workzoneoverviewer.controller
 */
export default class Overview extends Controller {

    public onInit(): void {
        this.collectData();
    }

    /**
     * Loads the hierarchy data and sets the model
     */
    public async collectData(): Promise<void> {
        console.log("Collecting data...");
        
        try {
            const response = await fetch("model/workzonedata.json");
            const data = await response.json();

            // Add the filter options to the data
            data.typeFilters = [
                { key: "all", text: "All Types" },
                { key: "role", text: "Roles" },
                { key: "space", text: "Spaces" },
                { key: "page", text: "Pages" },
                { key: "app", text: "Apps" }
            ];

            const oModel = new JSONModel(data);
            this.getView()?.setModel(oModel);
            console.log("Data loaded and Model set");
        } catch (error) {
            console.error("Error loading data:", error);
        }
    }

    /**
     * Handles search in the TreeTable
     */
    public onSearch(oEvent: any): void {
        const sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
        const oTable = this.byId("roleTree") as TreeTable;
        const oBinding = oTable.getBinding("rows") as RowBinding;

        if (!oBinding) return;

        if (sQuery && sQuery.length > 0) {
            const aFilters = [
                new Filter("id", FilterOperator.Contains, sQuery),
                new Filter("title", FilterOperator.Contains, sQuery),
                new Filter("type", FilterOperator.Contains, sQuery),
                new Filter("providerId", FilterOperator.Contains, sQuery),
                new Filter("fullId", FilterOperator.Contains, sQuery)
            ];

            oBinding.filter(new Filter({
                filters: aFilters,
                and: false
            }));
        } else {
            oBinding.filter([]);
        }
    }

    /**
     * Filters the tree by type (Role, Space, Page, App)
     */
    public onTypeFilterChange(oEvent: Select$ChangeEvent): void {
        const oSelectedItem = oEvent.getParameter("selectedItem");
        if (!oSelectedItem) return;

        const sSelectedKey = oSelectedItem.getKey();
        const oTable = this.byId("roleTree") as TreeTable;
        const oBinding = oTable.getBinding("rows") as RowBinding;

        if (!oBinding) return;

        if (sSelectedKey === "all") {
            oBinding.filter([]);
        } else {
            const oFilter = new Filter("type", FilterOperator.EQ, sSelectedKey);
            oBinding.filter([oFilter]);
        }
    }

    public onExpandAll(): void {
        (this.byId("roleTree") as TreeTable).expandToLevel(10);
    }

    public onCollapseAll(): void {
        (this.byId("roleTree") as TreeTable).collapseAll();
    }

    public onRefresh(): void {
        window.location.reload();
    }

    /**
     * Flattens the tree structure and exports to CSV
     */
    public onExport(): void {
        const oModel = this.getView()?.getModel() as JSONModel;
        const aRoles = oModel.getProperty("/roles") as any[];

        const flattenData = (items: any[], level: number = 0): any[] => {
            let result: any[] = [];
            items.forEach(item => {
                result.push({
                    Level: level,
                    ID: item.id,
                    Name: item.title,
                    Type: item.type,
                    Provider: item.providerId || (item.type === 'role' ? 'BTP' : ''),
                    Spaces: item.spaceCount || "",
                    Pages: item.totalPages || item.pageCount || "",
                    Apps: item.totalApps || item.appCount || ""
                });
                if (item.children && item.children.length > 0) {
                    result = result.concat(flattenData(item.children, level + 1));
                }
            });
            return result;
        };

        const flatData = flattenData(aRoles);
        const csv = this._convertToCSV(flatData);
        this._downloadCSV(csv, "workzone_hierarchy.csv");
    }

    private _convertToCSV(data: any[]): string {
        if (data.length === 0) return "";

        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(",")];

        data.forEach(row => {
            const values = headers.map(header => `"${row[header]}"`);
            csvRows.push(values.join(","));
        });

        return csvRows.join("\n");
    }

    private _downloadCSV(csv: string, filename: string): void {
        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}