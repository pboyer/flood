define(['BaseNodeView', 'WatchNodeView', 'NumNodeView', 'ThreeCSGNodeView', 'ScriptView', 'OutputView', 'InputView','CustomNodeView'], 
  function(BaseNodeView, WatchNodeView, NumNodeView, ThreeCSGNodeView, ScriptView, OutputView, InputView, CustomNodeView){

  var nodeViewTypes = {};

  nodeViewTypes.Base = ThreeCSGNodeView;
  nodeViewTypes.Show = WatchNodeView;
  nodeViewTypes.Number = NumNodeView;
  nodeViewTypes.CustomNode = CustomNodeView;

  nodeViewTypes.Script = ScriptView;
  nodeViewTypes.Input = InputView;
  nodeViewTypes.Output = OutputView;

  return nodeViewTypes;

});
