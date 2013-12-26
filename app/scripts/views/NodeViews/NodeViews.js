define(['BaseNodeView', 'WatchNodeView', 'NumNodeView', 'CSGNodeView'], function(BaseNodeView, WatchNodeView, NumNodeView, CSGNodeView){

  var nodeViewTypes = {};

  nodeViewTypes.Base = BaseNodeView;
  nodeViewTypes.Watch = WatchNodeView;
  nodeViewTypes.Number = NumNodeView;

  nodeViewTypes.Sphere = CSGNodeView;
  nodeViewTypes.Cyl = CSGNodeView;
  nodeViewTypes.Cube = CSGNodeView;
  nodeViewTypes.SolidInter = CSGNodeView;
  nodeViewTypes.SolidUnion = CSGNodeView;
  nodeViewTypes.SolidDiff = CSGNodeView;

  return nodeViewTypes;

});