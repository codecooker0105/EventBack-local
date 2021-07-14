import Unit from './unit.js';

class Node extends Unit {

  constructor(entity, properties, uniqid) {

    super(entity, properties, uniqid);
    this.edges = [];
    this.inputEdges = [];
    this.outputEdges = [];

  }

  unlink() {

    let edges = this.edges;

    for (let i = 0, len = edges.length; i < len; i++) {
      edges[i].unlink();
    }

    return true;

  }

  toJSON() {

    return super.toJSON();

  }

}

export default Node;
