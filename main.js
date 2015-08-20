var TodoList = React.createClass({

  render: function() {
    var todoitem = this.props.todos.map(function(todo){
      return <Item blah={todo}/>
    });
    return <ul>{todoitem}</ul>;
  }

});

var Item = React.createClass({
  getInitialState(){
    return {checked: false};
  },

  toggleCheck: function(){
    console.log("clicked it", this.state.checked);
    var checked = this.state.checked;
    this.setState({checked: !checked});
  },

  render: function(){
    var cx = React.addons.classSet;
    var liClass = cx({
      checked: this.state.checked
    })
    return <li onClick={this.toggleCheck} className={liClass}>{this.props.blah}</li>
  }
})

var TodoApp = React.createClass({
  getInitialState: function(){
    return {
      complete: false,
      text:"",
      todos:[],
      todoLists:[],
      index: 0
    };
  },
  onChange: function(e){
    this.setState({text: e.target.value})
  },
  handleClick: function(){
    console.log('text', this.state.text)
    this.setState(
      {todos: this.state.todos.concat(this.state.text)}
    );
  },
  newList: function(){
    this.setState({
      todoLists: this.state.todoLists.concat([this.state.todos]),
      index: this.state.index += 1
    });
    React.render(<div>{this.state.todoLists}</div>, document.getElementById('test'))
    console.log(this.state.todoLists);
    console.log(this.state.index);
  },
  render: function(){
    return (
      <div>
        <TodoList todos={this.state.todos} />
        <input type="text" value={this.state.text} onChange={this.onChange} />
        <input type="submit" onClick={this.handleClick}/>
        <button onClick={this.newList}>New List</button>
      </div>
    );
  }
});

React.render(<TodoApp />, document.getElementById('content'));
