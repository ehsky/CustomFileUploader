import { LightningElement, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import uploadFile from "@salesforce/apex/FileUploaderClass.uploadFile";
import { FlowAttributeChangeEvent } from "lightning/flowSupport";

export default class CustomFileUploader extends LightningElement {
  @api recordId;
  @api supportedFileTypes;
  @api contentDocumentIds;
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
    const { base64, filename, recordId } = this.fileData;
    uploadFile({ base64, filename, recordId }).then((result) => {
      this.fileData = null;
      let title = `${filename} uploaded successfully!!`;
      this.toast(title);
      this._contentDocumentIds.add(result);
      this.setFlowOutput();
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
    const attributeChangeEvent = new FlowAttributeChangeEvent(
      "contentDocumentIds",
      this._contentDocumentIds
    );
    this.dispatchEvent(attributeChangeEvent);
  }
}
