import { LightningElement, api, track } from "lwc";
// import uploadFile from "@salesforce/apex/FileUploaderClass.uploadFile";
import {
  FlowAttributeChangeEvent,
  FlowNavigationNextEvent
} from "lightning/flowSupport";
import { deleteRecord } from "lightning/uiRecordApi";

import { createRecord } from "lightning/uiRecordApi";
import { gql, graphql } from "lightning/uiGraphQLApi";

// The ContentVersion object and fields constants
import CONTENT_VERSION from "@salesforce/schema/ContentVersion";
import VERSION_DATA from "@salesforce/schema/ContentVersion.VersionData";
import TITLE from "@salesforce/schema/ContentVersion.Title";
import PATH_ON_CLIENT from "@salesforce/schema/ContentVersion.PathOnClient";

export default class CustomFileUploader extends LightningElement {
  @api recordId;
  @api supportedFileTypes;
  @api contentDocumentIds;
  @api buttonLabel = "Upload";
  @api navigateNextOnUpload = false;
  @api showPillContainer = false;
  @track files = [];
  _contentDocumentIds = [];

  fileData;

  connectedCallback() {
    this.fetchFiles();
  }

  /**
   * Handles the file read event and uploads the file.
   * @param {Event} event - The event triggered by file selection.
   */
  async handleReadFile(event) {
    await this.readFile(event);
    await this.handleUploadFile();
  }

  /**
   * Reads the selected file and converts it to a base64 string.
   * @param {Event} event - The event triggered by file input.
   */
  async readFile(event) {
    console.debug("openFileUpload", event);
    const file = event.target.files[0];
    let reader = new FileReader();
    reader.onload = async () => {
      var base64 = reader.result.split(",")[1];
      this.fileData = {
        filename: file.name,
        base64: base64,
        recordId: this.recordId
      };
      console.log(this.fileData);
    };
    reader.readAsDataURL(file);
    console.log("fileData", this.fileData);
  }

  /**
   * Handles the upload of the file to the ContentVersion object.
   */
  async handleUploadFile() {
    console.log("handleUploadFile");
    const { base64, filename, recordId } = this.fileData;
    this.createContentVersion({ base64, filename, recordId })
      .then((result) => {
        this.fileData = null;
        console.debug("result apx", result);
        this.files.push({ fileName: filename, recordId: result });
        this._contentDocumentIds.push(result);
      })
      .then(() => {
        this.setFlowOutput();
      })
      .finally(() => {
        if (this.navigateNextOnUpload) {
          const navigateNextEvent = new FlowNavigationNextEvent();
          this.dispatchEvent(navigateNextEvent);
        }
        console.log("this.files", this.files);
      });
  }

  /**
   * Sets the flow output for the uploaded content document IDs.
   */
  setFlowOutput() {
    console.debug("Files uploaded", JSON.stringify(this._contentDocumentIds));
    const attributeChangeEvent = new FlowAttributeChangeEvent(
      "contentDocumentIds",
      this._contentDocumentIds
    );
    this.dispatchEvent(attributeChangeEvent);
  }

  /**
   * Removes a file from the uploaded list.
   * @param {Event} event - The event triggered by remove action.
   */
  handleRemove(event) {
    console.log("handleRemove", event.target.dataset);
    let recordId = event.target.dataset.recordId;
    if (recordId) {
      deleteRecord(recordId);
      this._contentDocumentIds = this._contentDocumentIds.filter(
        (id) => id !== recordId
      );
      this.files = this.files.filter((file) => file.recordId !== recordId);
    }
  }

  fetchFiles() {
    if (this.contentDocumentIds) {
      this.fetchContentVersions(this.contentDocumentIds).then(
        (contentVersions) => {
          this.files = contentVersions.map((record) => ({
            fileName: record.Title,
            recordId: record.Id
          }));
        }
      );
    }
  }

  /**
   * Creates a new ContentVersion record with the uploaded file data.
   * @param {string} base64String - The base64 encoded string of the file.
   * @param {string} filename - The name of the file.
   * @returns {Promise<string|null>} - The ID of the created ContentVersion or null on error.
   */
  async createContentVersion(base64String, filename) {
    const base64Decoded = atob(base64String); // Decode base64 string to binary data
    const fields = {
      [VERSION_DATA]: base64Decoded,
      [TITLE]: filename,
      [PATH_ON_CLIENT]: filename
    };
    const recordInput = { apiName: CONTENT_VERSION, fields };
    // Insert the ContentVersion record
    try {
      const contentVersion = await createRecord(recordInput);
      console.log("ContentVersion created with Id:", contentVersion.id);
      return contentVersion.id;
    } catch (error) {
      console.error("Error creating ContentVersion:", error);
      return null;
    }
  }

  /**
   * Fetches ContentVersion records based on the provided IDs.
   * @param {Array<string>} ids - The list of ContentVersion IDs to fetch.
   * @returns {Promise<Array<CONTENT_VERSION>>} - A promise that resolves to the fetched ContentVersion records.
   */
  async fetchContentVersions(ids) {
    // Construct the GraphQL query
    const query = gql`
      query GetContentVersions($ids: [ID!]) {
        uiapi {
          query {
            ContentVersion(where: { Id: { in: $ids } }) {
              edges {
                node {
                  Id
                  ContentDocumentId {
                    value
                  }
                  Title {
                    value
                  }
                }
              }
            }
          }
        }
      }
    `;
    // Execute the GraphQL query
    try {
      const response = await graphql({ query, variables: { ids } });
      return response.data.uiapi.query.ContentVersion.edges.map(
        (edge) => edge.node
      );
    } catch (error) {
      console.error("Error fetching ContentVersion records:", error);
      return []; // Return an empty array in case of an error
    }
  }
}
