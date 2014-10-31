'use strict';

/* global SumoDB, nunjucks */

(function(exports) {
  var question_id;

  function submit_comment(evt) {
    evt.preventDefault();
    var comment = document.getElementById('question_field').value;

    document.getElementById('spinner').classList.remove('hide');
    document.getElementById('thread-introduction').classList.add('hide');
    document.getElementById('question-thread').classList.remove('hide');

    var fake_comment = nunjucks.render('comment.html',
      {comment: {content: comment}});
    var list = document.getElementById('comment-list');
    list.innerHTML += fake_comment;
    var comment_to_replace = list.lastElementChild;
    comment_to_replace.scrollIntoView();

    var submit_promise;
    if (question_id) {
      submit_promise = submit_answer(question_id, comment);
    } else {
      submit_promise = submit_question(comment).then(function(comment) {
        comment.content = comment.title;
        return comment;
      });
    }

    submit_promise.then(function(comment) {
      document.getElementById('spinner').classList.add('hide');
      comment_to_replace.innerHTML = nunjucks.render('comment.html',
        {comment: comment});
    });
  }

  function parseQueryString(queryString) {
      var params = {};

      var queries = queryString.split('&');

      // Convert the array of strings into an object
      for (var i = 0, l = queries.length; i < l; i++) {
          var [key, value] = queries[i].split('=');
          params[key] = value;
      }

      return params;
  }

  function submit_question(comment) {
    return SumoDB.post_question(comment).then(function(response) {
      question_id = response.id;
      return response;
    });
  }

  function submit_answer(question_id, comment) {
    return SumoDB.post_answer(question_id, comment).then(function(response) {
      return response;
    });
  }

  function show_question() {
    if (!question_id) {
      return;
    }

    document.getElementById('thread-introduction').classList.add('hide');
    document.getElementById('question-thread').classList.remove('hide');

    var question_content = [];
    question_content.push(SumoDB.get_question(question_id));

    question_content.push(SumoDB.get_answers_for_question(question_id));

    Promise.all(question_content).then(function([question, answers]) {
      question.content = question.title;
      answers.push(question);
      answers.reverse();
      var html = nunjucks.render('thread.html', {
        results: answers
      });
      document.getElementById('comment-list').innerHTML = html;
    });
  }

  var QuestionController = {
    init: function() {
      var form = document.getElementById('question_form');
      form.addEventListener('submit', submit_comment);

      if (location.search) {
        var params = parseQueryString(location.search.substring(1));
        if (params.id) {
          question_id = params.id;
          show_question();
        }
      }
    }
  };
  exports.QuestionController = QuestionController;
  QuestionController.init();
})(window);