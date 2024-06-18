const uploadFile = (req, res) => {
    let logo;
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }
  
    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    logo = req.files.logo;
  
    // Use the mv() method to place the file somewhere on your server
    logo.mv(`assets/${logo.name}`, function(err) {
      if (err)
        return res.status(500).send(err);
  
      console.log('File uploaded!');
    });
  };
  
  module.exports = {
    uploadFile,
  };