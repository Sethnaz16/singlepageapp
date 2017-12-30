import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import '../css/app.css';

/**
 * The main App component
 */
class App extends React.Component {
  constructor(props) {
    super(props);
    this.initAjax();
    this.state = {data: [], page: 0, maxPage: Number.MAX_SAFE_INTEGER};
    this.state.node = {nid: '', node_title: '', node_body: ''};
    // bind all methods to 'this'
    this.fetchData = this.fetchData.bind(this);
    this.setPage = this.setPage.bind(this);
    this.pagePrev = this.pagePrev.bind(this);
    this.pageNext = this.pageNext.bind(this);
    this.refresh = this.refresh.bind(this);
    this.saveData = this.saveData.bind(this);
    this.selectNode = this.selectNode.bind(this);
    this.removeNode = this.removeNode.bind(this);
  }
    

  /**
   * Builds the baseURL from the current window.location.href
   * by stripping the first subdomain and trailing path, and
   * then creates an instance of axios (ajax) that uses the baseURL,
   * sends auth cookie and sends csrf token with every future
   * AJAX request.
   */
  initAjax() {
    // regex to strip the first subdomain and trailing path
    // http://sub.domain.com/some/path.html -> http://domain.com/
    let baseURL = "http://localhost:8888/singlepageapp/web/"
//    if(this.props.baseURL) {
//      baseURL = this.props.baseURL;
//    } else {
//      const regex = /(.*:\/\/)[^\.]*\.([^\/]*).*$/;
//      baseURL = window.location.href.replace(regex, '$1$2');
//    }
    const tokenURL = baseURL + 'rest/session/token';
    // first request is to fetch csrf token
    const req = axios.get(tokenURL, {
      withCredentials: true // required to send auth cookie
    });
    req.then((response) => {
      const csrf_token = response.data;
      this.ajax = axios.create({
        baseURL,
        withCredentials: true, // include auth cookie
        headers: {
          'X-CSRF-Token': csrf_token,
        },
      });
      // set baseURL as property on 'this'
      this.baseURL = baseURL;
      // fetch the default page data
      this.fetchData();
    });
  }

  setPage(num) {
    this.fetchData(num);
  }

  pagePrev() {
    // only if we're after first page
    if(this.state.page > 0) {
      this.setPage(this.state.page-1);
    }
  }

  pageNext() {
    // only if we're before last page
    if(
        this.state.maxPage != Number.MAX_SAFE_INTEGER
        && this.state.page >= this.state.maxPage
      ) {
      return;
    }
    this.setPage(this.state.page+1);
  }

  refresh() {
    this.setState({maxPage: Number.MAX_SAFE_INTEGER});
    this.fetchData(this.state.page);
  }

  fetchData(page = 0) {
    const req = this.ajax.get('node/rest', {params: {page}});
    req.then((response) => {
      if(response.data.length == 0) {
        this.setState({maxPage: this.state.page});
      } else {
        this.setState({data: response.data, page});
      }
    });
  }

  saveData(event) {
    var form = event.target;
    var node = {
      type: [{
        target_id: 'article',
        target_type: 'node_type',
      }],
      title: [{
        value: this.state.node.node_title,
      }],
      body: [{
        value: this.state.node.node_body,
        format: 'plain_text',
      }],
    };
    var nid = this.state.node.nid;
    var req;
    if(nid) {
      // existing node
      req = this.ajax.patch(`node/${nid}?_format=json`, node);
    } else {
      // new node
      req = this.ajax.post('entity/node', node);
    }
    req.then((response) => {
      // reset the node input form
      form.reset();
      this.setState({node: {nid: '', node_title: '', node_body: ''}});
      // refresh the node list once the new node has been saved
      this.setPage(0);
    });
    event.preventDefault();
  }

  selectNode(node) {
    var req = this.ajax.get(`node/${node.nid}?_format=json`);
    req.then((response) => {
      let node = response.data;
      const node_input = {
        nid: node.nid[0].value,
        node_title: node.title[0].value,
        node_body: node.body[0].value
      }
      console.log(node_input);
      this.setState({node: node_input});
    });
  }

  removeNode(nid) {
    const req = this.ajax.delete(`node/${nid}`);
    req.then((response) => {
      this.refresh();
    });
  }

  render() {
    return (
      <div>
        <NodeEditForm app={this}/>
        <Pager app={this}/>
        <NodeList app={this} data={this.state.data} baseURL={this.baseURL}/>
        <Pager app={this}/>
      </div>
    );
  }
}

const Pager = ({app}) => {
  return(
    <div className="btn-group" role="group" aria-label="...">
      <button type="button" className="btn btn-default"
        onClick={app.pagePrev} disabled={app.state.page <= 0}>
        <i className="glyphicon glyphicon-chevron-left"></i>
      </button>
      <button type="button" className="btn btn-default" onClick={app.refresh}>
        <i className="glyphicon glyphicon-refresh"></i>
      </button>
      <button type="button" className="btn btn-default" onClick={app.pageNext}
        disabled={app.state.page >= app.state.maxPage}>
        <i className="glyphicon glyphicon-chevron-right"></i>
      </button>
    </div>
  );
}

const NodeList = ({app}) => {
  const data = app.state.data;
  //const baseURL = app.baseURL;
  const baseURL = "http://localhost:8888";
  return (
    <table className="table table-bordered table-striped table-hover table-responsive">
      <thead>
        <tr><th>NID</th><th>Title</th><th>Path</th><th>&nbsp;</th></tr>
      </thead>
      <tbody>
        {
          data.map((node, i) => {
            return (
              <tr
                key={node.nid}
                onClick={() => app.selectNode(node)}
              >
                <td>{node.nid}</td>
                <td><a href={baseURL + node.path} target="drupal">{node.title}</a></td>
                <td>{node.path}</td>
                <td>
                  <a onClick={() => app.removeNode(node.nid)}>
                    <i className="glyphicon glyphicon-remove"></i>
                  </a>
                </td>
              </tr>
            );
          })
        }
      </tbody>
    </table>
  );
}

const NodeEditForm = ({app}) => {
  const handleChange = (e) => {
    let node = app.state.node;
    node[e.target.name] = e.target.value;
    app.setState({node});
  }
  const reset = (e) => {
    app.setState({node: {nid: '', node_title: '', node_body: ''}});
  }
  return(
    <div className="well">
      <form onSubmit={app.saveData}>
        <input name='nid' type="hidden" value={app.state.node.nid}></input>
        <input
          name="node_title"
          required="required"
          type="text"
          className="form-control"
          placeholder="Node Title"
          value={app.state.node.node_title}
          onChange={handleChange}>
        </input>
        <textarea
          name="node_body"
          required="required"
          className="form-control"
          placeholder="Node Body"
          value={app.state.node.node_body}
          onChange={handleChange}>
        </textarea>
        <button><i className="glyphicon glyphicon-ok"></i> Save</button>
        <button type="reset" onClick={reset}><i className="glyphicon glyphicon-stop"></i> Reset</button>
      </form>
    </div>
  );
}
// code to inject JSX into page DOM
const wrapper = document.getElementById('app');
// optional attribute to set Drupal's URL
const baseURL = wrapper.getAttribute('data-drupal-url');
ReactDOM.render(
  <App baseURL={baseURL}/>,
  wrapper
);
