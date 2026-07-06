const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'essence',
  api_key: '926476138849714',
  api_secret: 'RIf1N_n1ugblKCT3UTjSOG0LVm8'
});

cloudinary.api.ping(function(error, result) {
  if (error) {
    console.log("Error with 'essence':", error.message);
    
    // Try dedfrilse
    cloudinary.config({
      cloud_name: 'dedfrilse',
      api_key: '926476138849714',
      api_secret: 'RIf1N_n1ugblKCT3UTjSOG0LVm8'
    });
    cloudinary.api.ping(function(err, res) {
      if (err) console.log("Error with 'dedfrilse':", err.message);
      else console.log("Success with 'dedfrilse'!");
    });
  } else {
    console.log("Success with 'essence'!");
  }
});
