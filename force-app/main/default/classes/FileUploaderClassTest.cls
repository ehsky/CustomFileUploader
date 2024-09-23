/**
 * @description       : 
 * @author            : Erlend.Hansen@stretch.no | https://trailblazer.me/id/ehansen7
 * @group             : 
 * @last modified on  : 09-23-2024
 * @last modified by  : Erlend.Hansen@stretch.no | https://trailblazer.me/id/ehansen7
**/
@IsTest
public class FileUploaderClassTest {
    @IsTest
    static void testUploadFile() {
        // Create a test record to attach the file to
        Task testTask = new Task(Subject = 'Test Subject');
        insert testTask;
        // Create a test file
        String base64 = 'Test file content';
        String filename = 'test.txt';
        // Call the uploadFile method
        String result = FileUploaderClass.uploadFile(base64, filename, testTask.Id);
        // Query the ContentDocumentLink object to verify the file was attached to the test record
        List<ContentDocumentLink> cdl = [SELECT Id FROM ContentDocumentLink WHERE LinkedEntityId = :testTask.Id];
        System.assertNotEquals(null, result, 'File upload should succeed');
        System.assertEquals(1, cdl.size(), 'File should be attached to the test record');
    }
}
