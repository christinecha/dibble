setInterval(function(){
  var captions = [
     'Jesse and Kareem are sharing Calculus study tricks.',
     'Xian-Yi is connecting with mentor Penny.',
     'Jeb and Beb are studying for the LSAT together.',
     'Mick is being a better manager to intern Gary.',
     'Henry is a more engaging piano teacher to Priya now.',
     '"Learning French 10 minutes a day is so much better - and faster," says Franz.',
     'Mindy can get personalized homework help without leaving the house.'
  ];
  var random = (Math.floor(Math.random() * 5) + 1);
  var random2 = random + 1;
  var random3 = (Math.floor(Math.random() * (captions.length - 1)) + 1);

  $('.face1').attr('src', 'assets/face-0' + random + '.png');
  $('.face2').attr('src', 'assets/face-0' + random2 + '.png');

  $('#home-section-2 .caption').text(captions[random3]);

}, 3000);
