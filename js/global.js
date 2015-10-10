//Global Variables
var ref = new Firebase('https://dibbleapp.firebaseio.com/');
var currentUser = {};
var currentAssignments = {};
var currentGroup;
var assignmentsRef = ref.child('assignments');
var usersRef = ref.child('users');
var groupsRef = ref.child('groups');
$('#header').load("_header.html");
$('#header').on('click', '.logout', function(){
  ref.unauth();
  location.href = "login.html";
});

// USER AUTHENTICATION ------------------------------------------

//Sign Up With Email
$('#userSignUp').on('click', function(){
  var usersRef = ref.child('users');
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
    }
  });

});

// Log In
$('#userLogin').on('click', function(){
  var email = $('#email').val();
  var password = $('#password').val();

  ref.authWithPassword({
    "email"    : email,
    "password" : password,
  }, function(error, authData) {
    if (error) {
      console.log("Login Failed!", error);
    } else {
      console.log("Authenticated successfully with payload:", authData);
      location.href = "index.html";
    }
  });
});

// Create a callback which logs the current auth state
function authDataCallback(authData) {
  if (authData) {
    console.log("User " + authData.uid + " is logged in with " + authData.provider);
    currentUser = authData;
  } else {
    console.log("User is logged out");
    currentUser = {};
  }
}
// Register the callback to be fired every time auth state changes
ref.onAuth(authDataCallback);

//Store User Data
var isNewUser = true;
ref.onAuth(function(authData) {
  if (authData && isNewUser) {
    // save the user's profile into the database so we can list users,
    // use them in Security and Firebase Rules, and show profiles
    ref.child("users").child(authData.uid).update({
      provider: authData.provider,
      name: getName(authData)
    });
  }
});
// find a suitable name based on the meta info given by each provider
function getName(authData) {
  switch(authData.provider) {
     case 'password':
       return authData.password.email.replace(/@.*/, '');
  }
};

// DISPLAY USER'S GROUPS + SET CURRENTGROUP ------------------------------------------
var usersGroupsRef = usersRef.child(currentUser.uid).child('groups');

usersGroupsRef.on("value", function(snapshot) {
  snapshot.forEach(function(childSnapshot) {
    var group = childSnapshot.key();
    displayGroups(group);
  });
});

function displayGroups (group){
  var $group = $('<a>').text(group).addClass('.group').val(group);
  $('#groups').append($group).append('<br>');
  currentGroup = group;
};

$('#groups').on("click", "a", function(){
  currentGroup = $(this).val();
  console.log('currentGroup is now ' + currentGroup);
  loadAssignments();
});


// DISPLAY CURRENT GROUP'S ASSIGNMENTS -------------------------------------
loadAssignments();
function loadAssignments(){
  $('#assignments').children('div').remove();

  assignmentsRef.on("value", function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      var assignment = childSnapshot.val();
      var group = childSnapshot.val().group;
      //isolate assignments available in current group ONLY
      if (group == currentGroup){
        //get comments for specified assignment
        var commentsRef = assignmentsRef.child(childSnapshot.key()).child('comments');
        var comments = [];
        commentsRef.on("value", function(commentSnapshot) {
          //iterate over each comment
          commentSnapshot.forEach(function(commentChildSnapshot) {
            var comment = commentChildSnapshot.val();
            comments.push(comment);
          });
        });
        displayAssignment(childSnapshot.key(), assignment.title, assignment.description, assignment.complete, comments);
      };
    });
  });

  function displayAssignment (key, title, description, complete, comments) {
    var status;
    var statusOpposite;
    complete == true ? status = 'complete' : status = 'incomplete';
    complete == true ? statusOpposite = 'incomplete' : statusOpposite = 'complete';
    var $title = $('<h3>').text(title).addClass(status);
    var $description = $('<p>').text(description).addClass(status);
    var $buttonComplete = $('<button>').text('MARK AS ' + statusOpposite).addClass('button' + statusOpposite);
    var $buttonDelete = $('<button>').text('DELETE ASSIGNMENT').addClass('buttonDelete');

    //render comments
    var $comments = $('<div>').addClass('comments').html('<h6>COMMENTS & FEEDBACK</h6>');
    for (var i = 0; i < comments.length; i++){
      var $comment = $('<p>').addClass('comment').html(comments[i].comment + '<br><span class="commentauthor">added by ' + comments[i].user + '</span>');
      console.log(comments[i].comment);
      $comments.append($comment);
    };
    var $commentFormInput = $('<input>').attr('type', 'text').attr('placeholder','Say something...').attr('id', 'commentFormInput');
    var $commentFormSubmit = $('<button>').text('ADD').attr('id', 'commentFormSubmit');
    var $commentForm = $('<div>').addClass('commentForm').append($commentFormInput).append($commentFormSubmit);
    $comments = $comments.append($commentForm);

    //put it all together now!
    var $assignment = $('<div>').addClass('assignment').attr('id', key).addClass(status).append($title).append($description).append($comments).append('<br>').append($buttonComplete).append($buttonDelete);
    $('#assignments').append($assignment);
  };
};

// mark assignment as complete
$('#assignments').on('click', '.buttoncomplete', function(){
  var assignmentKey = $(this).parent('.assignment').attr('id');
  assignmentsRef.child(assignmentKey).update({
    complete : true
  });
  loadAssignments();
});

$('#assignments').on('click', '.buttonincomplete', function(){
  var assignmentKey = $(this).parent('.assignment').attr('id');
  assignmentsRef.child(assignmentKey).update({
    complete : false
  });
  loadAssignments();
});

// delete assignment
$('#assignments').on('click', '.buttonDelete', function(){
  var assignmentKey = $(this).parent('.assignment').attr('id');
  assignmentsRef.child(assignmentKey).remove();
  loadAssignments();
});

// add assignment
$('.addAssignment').on('click', function(){
  $('#assignmentForm').toggle();
});

$('#assignmentFormSubmit').on('click', function(){
  assignmentsRef.push({
    title: $('#assignmentTitleInput').val(),
    description: $('#assignmentDescriptionInput').val(),
    group: currentGroup,
    complete: false
  });
  $('#assignmentTitleInput').val('');
  $('#assignmentDescriptionInput').val('');
  $('#assignmentForm').hide();
  loadAssignments();
});

// add comment
$('#assignments').on('click', '#commentFormSubmit', function(){
  var assignmentKey = $(this).parent().parent().parent('.assignment').attr('id');
  console.log($(this).attr('id'));
  var commentsRef = assignmentsRef.child(assignmentKey).child('comments');
  commentsRef.push({
    comment: $('#commentFormInput').val(),
    user: currentUser.uid
  });
  $('#commentFormInput').val('');
  loadAssignments();
});

//delete comment
