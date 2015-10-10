// var userRef = ref.child('users');
// console.log('current user is ' + currentUser.uid);
// var assignmentsRef = ref.child('users').child('ba_at_ba_dot_com').child('assignments');
//
// //
// $('#assignments').on('change', 'input.file', function(e) {
//   var assignmentId = $(this).parent('.assignment').attr('id');
//   var uniqueAssigmentRef = assignmentsRef.child(assignmentId);
//   var assignmentFile = ($(this))[0].files[0];
//   var assignmentFilePreview = $(this).siblings('.filepreview');
//
//   var reader = new FileReader();
//
//   reader.onload = function(){
//     var filePayload = reader.result;
//     assignmentFile = assignmentRef
//     assignmentFilePreview.attr('src', dataURL);
//   };
//
//   reader.readAsDataURL(assignmentFile);
//
//   uniqueAssigmentRef.update({
//     "file": "hi"
//   });
//
//   // myAssignments.push({
//   //   title: entryTitle,
//   //   file: entryFile,
//   //   notes: entryNotes
//   // });
//
// });
