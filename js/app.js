/*global jQuery, Handlebars, Router */
/* jQuery(function ($) {
	'use strict'; */
	(function()	{
	'use strict';
	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;

	var util = {
		uuid: function () {
			/*jshint bitwise:false */
			var i, random;
			var uuid = '';

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
			}

			return uuid;
		},
		pluralize: function (count, word) {
			return count === 1 ? word : word + 's';
		},
		store: function (namespace, data) {  // uses local storage to  store items in todos-STORAGE key
			if (arguments.length > 1) {
				return localStorage.setItem(namespace, JSON.stringify(data));
			} else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}
	};

	var App = {
		init: function () {
			this.todos = util.store('todos-STORAGE');
			var todoTem = document.getElementById('todo-template').innerHTML;
			// this.todoTemplate = Handlebars.compile($('#todo-template').html());
			this.todoTemplate = Handlebars.compile(todoTem);
			var footerTem = document.getElementById('footer-template').innerHTML;
			// this.footerTemplate = Handlebars.compile($('#footer-template').html());
			this.footerTemplate = Handlebars.compile(footerTem);
			this.bindEvents();

			new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');	// url/#/all Showing all todos
		},
		bindEvents: function () {
			document.getElementById('new-todo').addEventListener('keyup', this.create.bind(this));
			// $('#new-todo').on('keyup', this.create.bind(this));
			document.getElementById('toggle-all').addEventListener('change', this.toggleAll.bind(this));
			// $('#toggle-all').on('change', this.toggleAll.bind(this));
			var footer = document.getElementById('footer');
	
			footer.addEventListener('click', function(e) {	// works
				if (e.target.id === 'clear-completed') {
					this.destroyCompleted();
				}
			}.bind(this));
			// $('#footer').on('click', '#clear-completed', this.destroyCompleted.bind(this));
			var todoList = document.getElementById('todo-list');

			todoList.addEventListener('change', function(e) {		// works
				if (e.target.className == 'toggle') {
					this.toggle(e);
				}
			}.bind(this));
			todoList.addEventListener('dblclick', function(e) {	// works? maybe?
				if (e.target.tagName == 'LABEL') {
					this.edit(e);
				}
			}.bind(this));
			todoList.addEventListener('keyup', function(e) {
				if (e.target.className == 'edit') {
					this.editKeyup(e);
				}
			}.bind(this));
			todoList.addEventListener('focusout', function(e) {
				if (e.target.className == 'edit') {
					this.update(e);
				}
			}.bind(this));
			todoList.addEventListener('click', function(e) {
				if (e.target.className == 'destroy') {
					App.destroy(e);
				}
			});
			// $('#todo-list')
			// 	.on('change', '.toggle', this.toggle.bind(this))	// checks checked in input.toggle
			// 	.on('dblclick', 'label', this.edit.bind(this))
			// 	.on('keyup', '.edit', this.editKeyup.bind(this))
			// 	.on('focusout', '.edit', this.update.bind(this))
			// 	.on('click', '.destroy', this.destroy.bind(this));
		},
		render: function () {	// checks todos whenever there is change in UI and updates todos on UI
      var todos = this.getFilteredTodos();	
      document.getElementById('todo-list').innerHTML = this.todoTemplate(todos); // 
			// $('#todo-list').html(this.todoTemplate(todos));
      // $('#main').toggle(todos.length > 0); // if todos length on display greater than 0 display: block
      var main = document.getElementById('main');	// less than 0 display: none on UI
      if (todos.length > 0) {
        main.style.display = 'block';
      } else {
        main.style.display = 'none';
			}
			var toggleAll = document.getElementById('toggle-all');
			
			if (this.getActiveTodos().length === 0) {	// replaced
				toggleAll.checked = true;	//	Change boolean value of #toggle-all if active todos equal to 0
			} else {
				toggleAll.checked = false;
			}
			// $('#toggle-all').prop('checked', this.getActiveTodos().length === 0); // replaced
      this.renderFooter();
      document.getElementById('new-todo').focus();  // replaced
			// $('#new-todo').focus();  // moves cursor to new-todo input
			util.store('todos-STORAGE', this.todos); // uses local storage to  store items in todos-STORAGE key
		},
		renderFooter: function () {
			var todoCount = this.todos.length;
			var activeTodoCount = this.getActiveTodos().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});
			var footerId = document.getElementById('footer');
			if (todoCount > 0) {
				footerId.style.display = 'block';
				footerId.innerHTML = template;
			} else {
				footerId.style.display = 'none';
			}
			// $('#footer').toggle(todoCount > 0).html(template);
			 // this will show/hide footer depends on no of todos element 
      // .toggle(todoCount >0) > As long as todoCount > 0; footer will show
      // .html(template) will injecting its template into #footer element
		},
		toggleAll: function (e) {
      var isChecked = e.target.checked; // replaced
			// var isChecked = $(e.target).prop('checked');
			this.todos.forEach(function (todo) {
				todo.completed = isChecked;
			});

			this.render();
		},
		getActiveTodos: function () {	// Getting todos not done
			return this.todos.filter(function (todo) {
				return !todo.completed;
			});
		},
		getCompletedTodos: function () {	// Getting todos done
			return this.todos.filter(function (todo) {
				return todo.completed;
			});
		},
		getFilteredTodos: function () {	// 
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}

			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}

			return this.todos;	// returns all todos in the array
		},
		destroyCompleted: function () {	// deletes completed todos
			this.todos = this.getActiveTodos();
			this.filter = 'all';	// Switches back to all
			this.render();
		},
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array
		indexFromEl: function (el) {
      var id = el.closest('li').getAttribute('data-id');  // Replaced
			// var id = $(el).closest('li').data('id'); // gets the closest 'li' and assigns id to a variable id. It was checked as class='completed' or not adds a class
			var todos = this.todos;
			var i = todos.length;

			while (i--) { // it loops count down to 0 to check all todos and returns todos.length 0
				if (todos[i].id === id) {
					return i;
				}
			}
		},
		create: function (e) {
      var $input = e.target;
      // var $input = $(e.target);  // gets the target attribute 'input#new-todo'
      var val = $input.value.trim();  // assigns to val="New Todo", $input= input#new-todo
			// var val = $input.val().trim();
			if (e.which !== ENTER_KEY || !val) {  // checks keyboard keys, if key not ENTER or not val exits
				return;                             // if statement, otherwise pushes to todo Array
			}

			this.todos.push({
				id: util.uuid(),
				title: val,
				completed: false
			});
      // $input.val('');
      $input.value = '';

			this.render();
		},
		toggle: function (e) {	// toggles the input.toggle 
			var i = this.indexFromEl(e.target);
			this.todos[i].completed = !this.todos[i].completed;
			this.render();
		},
		edit: function (e) {	// 
			var $input = e.target.closest('li');
			$input.className = 'editing';
			$input.querySelector('.edit').focus();
			// var $input = $(e.target).closest('li').addClass('editing').find('.edit');	// from target get closest li, add a class name than find child '.edit' class and assign it to $input.
			// $input.val($input.val()).focus();	// sets input to input and focus to it
		},
		editKeyup: function (e) {	// if enter and esc key pressed this will blur (loose focus) on enter key and aborts on esc key
			if (e.which === ENTER_KEY) {	// if any other key pressed it goes to update 0
				e.target.blur();
			}

			if (e.which === ESCAPE_KEY) {
				e.target.setAttribute('abort', true);
				e.target.blur();
				// $(e.target).data('abort', true).blur();
			}
		},
		update: function (e) {	// updated the target element with new value
			var el = e.target;
			var	$el = el;
			// var $el = $(el);
			var val = $el.value.trim();	// gets value and trim white space
			// var val = $el.val().trim();

			if (!val) {	// if value is not value run destroy method
				this.destroy(e);
				return;
			}
			if ($el.getAttribute('abort')) {	// if 
				$el.setAttribute('abort', false);
			} else {
				this.todos[this.indexFromEl(el)].title = val;
			}

			this.render();
		},
		destroy: function (e) {	// finds list items id translate it to position in the array and delete it from array
			this.todos.splice(this.indexFromEl(e.target), 1);
			this.render();
		}
	};

	App.init();
})();

