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
      $('.loginError').show();
      $('.loginError').text(error);
    } else {
      console.log("Successfully created user account with uid:", userData.uid);
      ref.authWithPassword({
        "email"    : email,
        "password" : password
      }, function(error, authData) {
        console.log("Authenticated successfully with payload:", authData);
        location.href = "index.html";
      });
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
      $('.loginError').show();
      $('.loginError').text(error);
    } else {
      console.log("Authenticated successfully with payload:", authData);
      location.href = "index.html";
    }
  });
});

// Log out
$('#header').on('click', '.logout', function(){
  ref.unauth();
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

// DISPLAY, EDIT, AND DEFINE USER'S GROUPS ------------------------------------------
var usersGroupsRef = usersRef.child(currentUser.uid).child('groups');

loadGroups();
function loadGroups(){
  $('#groups').children('.group').remove();

  usersGroupsRef.on("value", function(snapshot) {
    //get every available group
    snapshot.forEach(function(childSnapshot) {
      var group = childSnapshot.key();
      groupsRef.child(group).on("value", function(groupSnapshot){
        displayGroups(groupSnapshot.key(), groupSnapshot.val().name);
      });
    });
  });

  function displayGroups (groupId, groupName){
    $('.currentGroupIndicator').remove();
    $('.group').removeClass('currentGroup');
    var $editGroupButton = $('<button>').text('edit').addClass('editGroup');
    var $currentGroupIndicator = $('<img>').attr('src', 'assets/triangle-left-blue.png').addClass('currentGroupIndicator');
    var $group = $('<div>').text(groupName).addClass('group').addClass('currentGroup').val(groupId).append($editGroupButton);
    $group = $group.prepend($currentGroupIndicator);
    $('#groups').append($group);
    currentGroup = groupId;
    loadAssignments();
  };

  // if ($('#groups').children('group').length == 0){
  //   $('#noGroups').show();
  // } else {
  //   $('#noGroups').hide();
  // };
};

$('#groups').on("click", ".group", function(){
  $('.currentGroupIndicator').remove();
  $('.group').removeClass('currentGroup');
  var $currentGroupIndicator = $('<img>').attr('src', 'assets/triangle-left-blue.png').addClass('currentGroupIndicator');
  $(this).prepend($currentGroupIndicator);
  $(this).addClass('currentGroup');
  currentGroup = $(this).val();
  $('.menu').hide();
  loadAssignments();
});

$('.addGroup').on('click', function(){
  $('#groupForm').toggle();
});

$('#groupFormSubmit').on('click', function(){
  var user = currentUser.uid;
  var newGroupName = $('#groupTitleInput').val();
  //create Group
  var newGroupRef = groupsRef.push({
    name: newGroupName
  });
  var newGroupId = newGroupRef.key();
  //add currentUser to Group Members
  groupsRef.child(newGroupId).child('members').child(user).set(true);
  //add Group to Member's Info
  usersRef.child(user).child('groups').child(newGroupId).set(true);
  $('#groupTitleInput').val('');
  $('#groupPartnerInput').val('');
  $('#groupForm').hide();
  loadGroups();
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
    var $assignment = $('<div>').addClass('assignment').attr('id', key).addClass(status).append($title).append($description).append($comments).append($buttonComplete).append($buttonDelete);
    $('#assignments').append($assignment);
  };

  if ($('#assignments').children('.assignment').length == 0){
    $('#noAssignments').show();
  } else {
    $('#noAssignments').hide();
  };
};

//expand assignment
$('#assignments').on('click', '.assignment', function(){
  $(this).children('.comments').toggle();
  $(this).children('button').toggle();
});

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
