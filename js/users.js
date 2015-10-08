$(document).ready(function() {

  var ref = new Firebase('https://dibbleapp.firebaseio.com/');

  $('#userSignUp').on('click', function(){
    var email = $('#email').val();
    var password = $('#password').val();

    ref.createUser({
      email    : email,
      password : password
    }, function(error, userData) {
      if (error) {
        console.log("Error creating user:", error);
      } else {
        console.log("Successfully created user account with uid:", userData.uid);
        location.href = "views/index.html";
      }
    });

  });


  $('#userSignUp-FB').on('click', function(){
    ref.authWithOAuthRedirect("facebook", function(error) {
      if (error) {
        console.log("Login Failed!", error);
      } else {
        // We'll never get here, as the page will redirect on success.
      }
    });
  });


});
