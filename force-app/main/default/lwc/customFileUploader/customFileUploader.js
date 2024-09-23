import { LightningElement, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import uploadFile from "@salesforce/apex/FileUploaderClass.uploadFile";
import {
  FlowAttributeChangeEvent,
  FlowNavigationNextEvent
} from "lightning/flowSupport";

export default class CustomFileUploader extends LightningElement {
  @api recordId;
  @api supportedFileTypes;
  @api contentDocumentIds;
  @api buttonLabel = "Upload";
  @api navigateNextOnUpload = false;
  _contentDocumentIds = [];

  fileData;
  openFileUpload(event) {
    const file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = () => {
      var base64 = reader.result.split(",")[1];
      this.fileData = {
        filename: file.name,
        base64: base64,
        recordId: this.recordId
      };
      console.log(this.fileData);
    };
    reader.readAsDataURL(file);
  }

  handleUploadFile() {
    console.log("handleUploadFile");
    const { base64, filename, recordId } = this.fileData;
    uploadFile({ base64, filename, recordId })
      .then((result) => {
        this.fileData = null;
        console.debug("result apx", result);
        let title = `${filename} uploaded successfully!!`;
        this.toast(title);
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
      });
  }

  toast(title) {
    const toastEvent = new ShowToastEvent({
      title,
      variant: "success"
    });
    this.dispatchEvent(toastEvent);
  }

  setFlowOutput() {
    console.debug("Files uploaded", JSON.stringify(this._contentDocumentIds));
    const attributeChangeEvent = new FlowAttributeChangeEvent(
      "contentDocumentIds",
      this._contentDocumentIds
    );
    this.dispatchEvent(attributeChangeEvent);
  }
}
