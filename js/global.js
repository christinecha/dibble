//Global Variables
var ref = new Firebase('https://dibbleapp.firebaseio.com/');
var currentUser = {};
var currentUserId;
var currentUserObj = {};
var currentAssignments = {};
var currentGroup;
var currentGroupName;
var assignmentsRef = ref.child('assignments');
var usersRef = ref.child('users');
var groupsRef = ref.child('groups');
$('#header').load("_header.html");
$('#header').on('click', '.logout', function(){
  ref.unauth();
  location.href = "index.html";
});

// USER AUTHENTICATION ------------------------------------------

$('.alreadyUser').on('click', function(){
  $('#userSignUp').hide();
  $('#firstname').hide();
  $('#lastname').hide()
  $('#userLogin').show();
  $(this).hide();
  $('.notUserYet').show();
});

$('.notUserYet').on('click', function(){
  $('#userSignUp').show();
  $('#firstname').show();
  $('#lastname').show()
  $('#userLogin').hide();
  $(this).hide();
  $('.alreadyUser').show();
});

//Sign Up With Email
$('#userSignUp').on('click', function(){
  var usersRef = ref.child('users');
  var firstname = $('#firstname').val();
  var lastname = $('#lastname').val();
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
      ref.child("users").child(userData.uid).update({
        firstname: firstname,
        lastname: lastname,
        email: email,
      });
      ref.authWithPassword({
        "email"    : email,
        "password" : password
      }, function(error, authData) {
        console.log("Authenticated successfully with payload:", authData);
        location.href = "onboarding.html";
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
      location.href = "account.html";
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
    currentUserId = authData.uid;
    // DISPLAY CURRENT USER'S DETAILS -------------------------------------
    var currentUserRef = usersRef.child(currentUserId);
    currentUserRef.on("value", function(snapshot) {
      currentUserObj = snapshot.val();
      $('.accountinfo-firstname').text(currentUserObj.firstname);
      $('.accountinfo-lastname').text(currentUserObj.lastname);
      $('.accountinfo-email').text(currentUserObj.email);
      $('.accountinfo-skype').text(currentUserObj.skype);
      $('.accountinfo-venmo').text(currentUserObj.venmo);
      $('.accountinfo-paypal').text(currentUserObj.paypal);
    });
  } else {
    console.log("User is logged out");
    currentUser = {};
    currentUserId = '';
    currentUserObj = {};
    currentGroup = '';
    currentGroupName = '';
    if ( window.location.href.indexOf("index.html") > -1 ) {
      //do nothing
    } else {
      location.href = "index.html";
    };
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

$('#additionalInfoSignUp').on('click', function(){
  var skype = $('#skype').val();
  var venmo = $('#venmo').val();
  var phone = $('#phone').val().replace(/.\-/g, '');

  ref.child("users").child(currentUserId).update({
    skype: skype,
    venmo: venmo,
    phone: phone
  });
  location.href = "account.html";
});



// LOAD ACCOUNT INFO ------------------------------------------
var usersGroupsRef = usersRef.child(currentUser.uid).child('groups');
var groupsLoaded = false;
var initialGroupLoaded = false;

// initial load (one time only)
$(document).ready(function(){
  usersGroupsRef.once("value", function (snapshot) {
    snapshot.forEach(function(groupSnapshot){
      var groupKey = groupSnapshot.key();
      groupsRef.child(groupKey).on("value", function(snapshot){
        var $currentGroupIndicator = $('<img>').attr('src', 'assets/triangle-right-blue.png').addClass('currentGroupIndicator');
        var $group = $('<div>').text(snapshot.val().name).addClass('group').attr('id', groupKey).attr('data-name', snapshot.val().name);
        if (initialGroupLoaded == false) {
          currentGroup = snapshot.key();
          console.log('current group is ' + currentGroup);
          $group.addClass('currentGroup').append($currentGroupIndicator);
          $('.groupTitle').html(snapshot.val().name);
          displayGroupInfo(currentGroup);
          findAssignmentInfo(currentGroup);
          initialGroupLoaded = true;
        };
        $('#groups').append($group);
        if ($('#groups').children('.group').length == 0){
          $('#noGroups').show();
        } else {
          $('#noGroups').hide();
        };
      });
    });
    groupsLoaded = true;
  });
});


function findAssignmentInfo(currentGroup){
  $('#assignments').empty();
  assignmentsRef.orderByChild("group").equalTo(currentGroup).on("child_added", function(snapshot) {
    console.log('fAI called??');
    var assignment = snapshot.val();
    displayAssignment(snapshot.key(), assignment.title, assignment.description, assignment.complete);
  });
  if ($('#assignments').children('.assignment').length == 0){
    $('#noAssignments').show();
  } else {
    $('#noAssignments').hide();
  };
};

function displayAssignment (key, title, description, complete) {
  var status;
  var statusOpposite;
  complete == true ? status = 'complete' : status = 'incomplete';
  complete == true ? statusOpposite = 'incomplete' : statusOpposite = 'complete';
  var $title = $('<h3>').text(title).addClass(status).addClass('assignmentTitle');
  var $description = $('<p>').text(description).addClass('assignmentDescription').addClass(status);
  var $info = $('<div>').addClass('assignmentInfo').append($title).append('<i class="fa fa-pencil-square-o editIcon"></i>').append($description);
  var $buttonComplete = $('<button>').text('MARK AS ' + statusOpposite).addClass('button' + statusOpposite);
  var $buttonDelete = $('<button>').text('DELETE ASSIGNMENT').addClass('buttondelete');
  var $files = $('<div>').addClass('files').html('<h6>ATTACHMENTS & LINKS</h6>');
  var $comments = $('<div>').addClass('comments').html('<h6>COMMENTS & FEEDBACK</h6>');

 //render files
  ref.child('files').orderByChild('assignment').equalTo(key).on("value", function(fileSnapshot){
    fileSnapshot.forEach(function(childSnapshot){
      var file = childSnapshot.val();
      var $filename = $('<p>').html('<a class="fileLink" style="text-overflow: ellipsis;" target="_blank" href="' + file.filepath + '">' + file.filename + '<i class="fa fa-arrow-circle-o-down downloadIcon"></i></a><i class="fa fa-times-circle deleteIcon"></i>');
      var $file = $('<div>').addClass('file').attr('id', childSnapshot.key()).append($filename).attr('target', 'blank');
      $files.append($file);
    });
  });
  var $uploadInput = $('<input>').attr('type', 'file').attr('id', 'fileUploadInput');
  var $fileFormUpload = $('<div>').addClass('col-sm-6').append($uploadInput);

  var $urlInput = $('<input>').attr('type', 'text').attr('id', 'fileUrlInput').attr('placeholder', 'Enter URL');
  var $urlButton = $('<button>').attr('id', 'fileUrlSubmit').text('ADD');
  var $fileFormUrl = $('<div>').addClass('col-sm-6').append($urlInput).append($urlButton);

  var $fileForm = $('<div>').addClass('fileForm').append($fileFormUpload).append($fileFormUrl);

  //render comments
  ref.child('comments').orderByChild('assignment').equalTo(key).on("value", function(commentSnapshot){
    commentSnapshot.forEach(function(childSnapshot){
      var comment = childSnapshot.val();
      var $comment = $('<p>').addClass('comment').attr('id', childSnapshot.key()).html(comment.comment + '&nbsp&nbsp&nbsp<i class="fa fa-times-circle deleteIcon"></i><br><span class="commentauthor">added by ' + comment.commentAuthor + '</span>');
      $comments.append($comment);
    });
  });
  var $commentFormInput = $('<input>').attr('type', 'text').attr('placeholder','Say something...').attr('id', 'commentFormInput');
  var $commentFormSubmit = $('<button>').text('ADD').attr('id', 'commentFormSubmit');
  var $commentForm = $('<div>').addClass('commentForm').append($commentFormInput).append($commentFormSubmit);

  //put it all together now!
  var $assignment = $('<div>').addClass('assignment').attr('id', key).addClass(status).append($info).append($files).append($fileForm).append($comments).append($commentForm).append($buttonComplete).append($buttonDelete);
  $('#assignments').append($assignment);

  if ($('#assignments').children('.assignment').length == 0){
    $('#noAssignments').show();
  } else {
    $('#noAssignments').hide();
  };
};
//
function displayGroupInfo(currentGroup) {
  //clear Group Info Box
  $('.groupMembers').children('div').remove();
  //for each Group Member Key
  groupsRef.child(currentGroup).child('members').on('child_added', function(snapshot){
    console.log(snapshot.key() + ' is a member of ' + currentGroup);
    var member = snapshot.key();
    usersRef.child(member).on('value', function(userSnapshot){
      var $memberOptions = $('<div>').addClass('memberOptions').html('<a data-name="memberContact" class="member-expand">CONTACT</a> | <a class="member-expand" data-name="memberPay">PAY</a> | <a class="member-expand" data-name="memberCharge">CHARGE</a>');
      var $memberName = $('<p>').html('<strong>' + userSnapshot.val().firstname + ' ' + userSnapshot.val().lastname + '</strong>').addClass('memberName').append($memberOptions);

      var $memberEmail = $('<img>').attr('src', 'assets/contact-icon-03.png').addClass('contact-icon');
      $memberEmail = $('<a>').attr('href', 'mailto:' + userSnapshot.val().email).append($memberEmail);
      var $memberSkype = $('<img>').attr('src', 'assets/contact-icon-04.png').addClass('contact-icon');
      if (typeof userSnapshot.val().skype === 'undefined'){
        $memberSkype = '';
      } else {
        $memberSkype = $('<a>').attr('href', 'skype:' + userSnapshot.val().skype + '?call').append($memberSkype);
      };

      var $memberContact = $('<div>').addClass('memberContact').append($memberEmail).append($memberSkype);

      var $memberPay = $('<div>').addClass('memberPay').append('<input type="number" min="0.01" step="0.01" value="0.00">');
      var $memberCharge = $('<div>').addClass('memberCharge').append('<input type="number" min="0.01" step="0.01" value="0.00">');
      if (userSnapshot.val().venmo != null) {
        $memberPay = $memberPay.append(' <button id="memberPayVenmo" data-user="'+ userSnapshot.val().venmo + '">VENMO</button>');
        $memberCharge = $memberCharge.append(' <button id="memberChargeVenmo" data-user="'+ userSnapshot.val().venmo + '">VENMO</button>');
      };
      if (userSnapshot.val().paypal != null) {
        $memberPay = $memberPay.append(' <button id="memberPayPaypal" data-user="'+ userSnapshot.val().paypal + '">PAYPAL</button>');
        // $memberCharge = $memberCharge.append(' <button id="memberChargePaypal" data-user="'+ userSnapshot.val().paypal + '">PAYPAL</button>');
      };
      if ((userSnapshot.val().venmo == null) && (userSnapshot.val().paypal == null)) {
        $memberPay = $memberPay.append('<p>This user has not set up payment yet.</p>')
        $memberCharge = $memberCharge.append('<p>This user has not set up payment yet.</p>')
      };

      var $memberInfo = $('<div>').addClass('memberInfo').append($memberName).append($memberContact).append($memberPay).append($memberCharge);

      $('.groupMembers').append($memberInfo);
    });
  });
};

// ON USER EVENTS, UPDATE ACCOUNT INFO -------------------------------
// SIDEBAR ACTIVITY

//expand Member info
$('.groupMembers').on('click', '.member-expand', function(){
  var target = $(this).attr('data-name');
  var targetClass = '.' + target;
  if ($(this).hasClass('expanded') == true){
    $(this).parent().parent().parent().children(targetClass).hide();
    $(this).removeClass('expanded');
  } else {
    $('.member-expand').removeClass('expanded');
    $(this).parent().parent().parent().children('div').hide();
    $(this).addClass('expanded');
    $(this).parent().parent().parent().children(targetClass).show();
  };
});

//pay via venmo
$('.groupMembers').on('click', '#memberPayVenmo', function(){
  var user = $(this).attr('data-user');
  var amount = $(this).siblings('input').val();
  var url = 'https://venmo.com/' + user + '?txn=pay&amount=' + amount;
  window.open(url, '_blank');
});

//charge via venmo
$('.groupMembers').on('click', '#memberChargeVenmo', function(){
  var user = $(this).attr('data-user');
  var amount = $(this).siblings('input').val();
  var url = 'https://venmo.com/' + user + '?txn=charge&amount=' + amount;
  window.open(url, '_blank');
});

//pay via paypal
$('.groupMembers').on('click', '#memberPayPaypal', function(){
  var user = $(this).attr('data-user');
  var amount = $(this).siblings('input').val();
  var url = 'https://www.paypal.com/cgi-bin/webscr?business=' + user + '&cmd=_xclick&currency_code=USD&amount=' + amount + '&item_name=Payment%20via%20Dibbl';
  window.open(url, '_blank');
});

//switch group
$('#groups').on("click", ".group", function(){
  $('.currentGroupIndicator').remove();
  $('.group').removeClass('currentGroup');
  var $currentGroupIndicator = $('<img>').attr('src', 'assets/triangle-right-blue.png').addClass('currentGroupIndicator');
  $(this).append($currentGroupIndicator);
  $(this).addClass('currentGroup');
  currentGroup = $(this).attr('id');
  currentGroupName = $(this).attr('data-name');
  $('.groupTitle').html(currentGroupName);
  $('.menu').hide();
  displayGroupInfo(currentGroup);
  findAssignmentInfo(currentGroup);
});

//add group
$('.addGroup').on('click', function(){
  $('#groupForm').toggle();
});

$('#groupFormSubmit').on('click', function(){
  var user = currentUser.uid;
  var newGroupName = $('#groupTitleInput').val();
  var newGroupRef = groupsRef.push({
    name: newGroupName,
  });
  addNewGroup(newGroupRef.key(), $('#groupPartnerInput').val());
});

var addNewGroup = function(newGroupId, newGroupPartnerEmail){
  usersRef.orderByChild("email").equalTo(newGroupPartnerEmail).on('value', function(snapshot) {
    snapshot.forEach(function(userSnapshot) {
      newGroupPartnerId = userSnapshot.key();
      groupsRef.child(newGroupId).child('members').child(newGroupPartnerId).set(true);
      usersRef.child(newGroupPartnerId).child('groups').child(newGroupId).set(true);
      groupsRef.child(newGroupId).child('members').child(user).set(true);
      usersRef.child(user).child('groups').child(newGroupId).set(true);
    });

    $('#groupTitleInput').val('');
    $('#groupPartnerInput').val('');
    $('#groupForm').hide();
  });
  location.href = "account.html";
};

//edit account info
var accountInfoExpanded = false;
  $('#accountinfo').on('click', '.editIcon', function(){
    if (accountInfoExpanded == false){
    var firstName = $('.accountinfo-firstname').text();
    var lastName = $('.accountinfo-lastname').text();
    var email = $('.accountinfo-email').text();
    var skype = $('.accountinfo-skype').text();
    var venmo = $('.accountinfo-venmo').text();
    var paypal = $('.accountinfo-paypal').text();

    $('.accountinfo-firstname').replaceWith('<input type="text" id="firstNameInput" value="' + firstName + '">');
    $('.accountinfo-lastname').replaceWith('<input type="text" id="lastNameInput" value="' + lastName + '">');
    $('.accountinfo-email').replaceWith('<input type="text" id="emailOld" value="' + email + '" readonly="true">');
    $('#emailOld').parent().append('<input type="text" id="emailNew" placeholder="new email">').append('<input type="password" id="passwordConf" placeholder="password to confirm">').append('<div class="error-email"></div>');
    $('.accountinfo-skype').replaceWith('<input type="text" id="skypeInput" value="' + skype + '">');
    $('.accountinfo-venmo').replaceWith('<input type="text" id="venmoInput" value="' + venmo + '">');
    $('.accountinfo-paypal').replaceWith('<input type="text" id="paypalInput" value="' + paypal + '">');
    $('#accountinfo-update').show();
    accountInfoExpanded = true;
  } else {
    // do nothing
  };
});

$('#accountinfo-update').on('click', function(){
  var firstName = $('#firstNameInput').val();
  var lastName = $('#lastNameInput').val();
  var emailOld = $('#emailOld').val();
  var emailNew = $('#emailNew').val();
  var passwordConf = $('#passwordConf').val();
  var skype = $('#skypeInput').val();
  var venmo = $('#venmoInput').val();
  var paypal = $('#paypalInput').val();

  var updateUserInfo = function() {
    usersRef.child(currentUserId).update({
      firstname: firstName,
      lastname: lastName,
      email: emailNew,
      skype: skype,
      venmo: venmo,
      paypal: paypal
    });
    location.href="account.html";
  };

  if (emailNew !== ''){
    ref.changeEmail({
      oldEmail: emailOld,
      newEmail: emailNew,
      password: passwordConf
    }, function(error) {
      if (error) {
        switch (error.code) {
          case "INVALID_PASSWORD":
            $('.error-email').text("The specified user account password is incorrect.");
            break;
          case "INVALID_USER":
            $('.error-email').text("The specified user account does not exist.");
            break;
          default:
            $('.error-email').text("Please enter a valid email address.");
            break;
        }
      } else {
        console.log("User email changed successfully!");
        updateUserInfo();
      }
    });
  } else {
    emailNew = emailOld;
    updateUserInfo();
  };
});

$('#change-password').on('click', function(){
  $('.passwordForm').toggle();
});

$('#update-password').on('click', function(){
  var email = $('.accountinfo-email').text();
  if (accountInfoExpanded == true){
    email = $('#emailOld').val();
  } else {
    //do nothing
  };
  var oldPassword = $('#oldPassword').val();
  var newPassword = $('#newPassword').val();

  ref.changePassword({
    email: email,
    oldPassword: oldPassword,
    newPassword: newPassword
  }, function(error) {
    if (error) {
      switch (error.code) {
        case "INVALID_PASSWORD":
          $('#error-password').text("The specified user account password is incorrect.");
          break;
        case "INVALID_USER":
          $('#error-password').text("The specified user account does not exist.");
          break;
        default:
          $('#error-password').text("Error changing password:", error);
      }
    } else {
      console.log("User password changed successfully!");
      $('#oldPassword').val('');
      $('#newPassword').val('');
      $('#error-password').val('');
    }
  });
});



// ON USER EVENTS EDIT ACCOUNT INFO -------------------------------------


//expand assignment
$('#assignments').on('click', '.assignmentInfo', function(){
  if ($(this).hasClass('forceShow') == true) {
  } else {
    $(this).parent().children('.comments').toggle();
    $(this).parent().children('.commentForm').toggle();
    $(this).parent().children('.files').toggle();
    $(this).parent().children('.fileForm').toggle();
    $(this).parent().children('button').toggle();
  };
});

// mark assignment as complete
$('#assignments').on('click', '.buttoncomplete', function(){
  var assignmentKey = $(this).parent('.assignment').attr('id');
  assignmentsRef.child(assignmentKey).update({
    complete : true
  });
  findAssignmentInfo(currentGroup);
});

$('#assignments').on('click', '.buttonincomplete', function(){
  var assignmentKey = $(this).parent('.assignment').attr('id');
  assignmentsRef.child(assignmentKey).update({
    complete : false
  });
  findAssignmentInfo(currentGroup);
});

// delete assignment
$('#assignments').on('click', '.buttondelete', function(){
  var assignmentKey = $(this).parent('.assignment').attr('id');
  assignmentsRef.child(assignmentKey).remove();
  findAssignmentInfo(currentGroup);
});

// add assignment
$('.addAssignment').on('click', function(){
  $('#assignmentForm').toggle();
});

$('#home').on('click', '#assignmentFormSubmit', function(){
  var assignmentTitle;
  var assignmentDescription = $(this).siblings('#assignmentDescriptionInput').val();
  if ($(this).siblings('#assignmentTitleInput').val() == '') {
    assignmentTitle = 'Untitled';
  } else {
    assignmentTitle = $(this).siblings('#assignmentTitleInput').val();
  };
  if ($(this).hasClass('editing') == true) {
    var assignmentKey = $(this).parent().parent('.assignment').attr('id');
    assignmentsRef.child(assignmentKey).update({
      title: assignmentTitle,
      description: assignmentDescription,
    });
  } else if ($(this).hasClass('new') == true) {
    assignmentsRef.push({
      title: assignmentTitle,
      description: assignmentDescription,
      group: currentGroup,
      complete: false
    });
  };
  $('#assignmentTitleInput').val('');
  $('#assignmentDescriptionInput').val('');
  $('#assignmentForm').hide();
  findAssignmentInfo(currentGroup);
});

// edit assignment
$('#assignments').on('click', '.editIcon', function(){
  console.log('clicked');
  $(this).parent().addClass('forceShow');
  $(this).parent().parent('.assignment').show();
  var currentAssignmentTitle = $(this).siblings('.assignmentTitle').text();
  var currentAssignmentDescription = $(this).siblings('.assignmentDescription').text();
  $(this).siblings('.assignmentTitle').replaceWith('<input type="text" id="assignmentTitleInput" value="' + currentAssignmentTitle + '">');
  $(this).siblings('.assignmentDescription').replaceWith('<textarea type="text" id="assignmentDescriptionInput">' + currentAssignmentDescription + '</textarea>');
  $(this).parent('.assignmentInfo').append('<button id="assignmentFormSubmit" class="editing">UPDATE</button>');
});

// add comment
$('#assignments').on('click', '#commentFormSubmit', function(){
  var assignmentKey = $(this).parent().parent('.assignment').attr('id');
  var commentsRef = ref.child('comments');
  commentsRef.push({
    comment: $(this).siblings('#commentFormInput').val(),
    commentAuthor: currentUserObj.firstname,
    assignment: assignmentKey,
  });
  $('#commentFormInput').val('');
  findAssignmentInfo(currentGroup);
});

// delete comment
$('#assignments').on('click', '.comments .deleteIcon', function(){
  var assignmentKey = $(this).parent().parent().parent('.assignment').attr('id');
  var commentKey = $(this).parent('.comment').attr('id');
  ref.child('comments').child(commentKey).remove();
  findAssignmentInfo(currentGroup);
});

// add file
$('#assignments').on('change', '#fileUploadInput', function(){
  var assignmentKey = $(this).parent().parent().parent('.assignment').attr('id');
  var filesRef = ref.child('files');
  var file = $(this)[0].files[0];
  var filename = $(this).val();
  filename = filename.replace('C:\\fakepath\\', '');
  console.log(assignmentKey, filename);
  var reader = new FileReader();

  reader.onloadend = function() {
    filesRef.push({
      filename: filename,
      filepath: reader.result,
      assignment: assignmentKey,
    });
    console.log('working')
    findAssignmentInfo(currentGroup);
  };

  reader.readAsDataURL(file);
});

// add link
$('#assignments').on('click', '#fileUrlSubmit', function(){
  var assignmentKey = $(this).parent().parent().parent('.assignment').attr('id');
  var url = $(this).siblings('#fileUrlInput').val();
  var http = url.search(new RegExp(/^http:\/\//i));
  var https = url.search(new RegExp(/^https:\/\//i));
  if( !http || !https ) {
  // its present
  } else {
    url = 'http://' + url;
  }

  ref.child('files').push({
    filename: url,
    filepath: url,
    assignment: assignmentKey,
  });

  findAssignmentInfo(currentGroup);
});

// delete file
$('#assignments').on('click', '.files .deleteIcon', function(){
  var assignmentKey = $(this).parent().parent().parent().parent('.assignment').attr('id');
  var fileKey = $(this).parent().parent('.file').attr('id');
  ref.child('files').child(fileKey).remove();
  findAssignmentInfo(currentGroup);
});


// PAYMENTS ------------------------------------------------------




////////
