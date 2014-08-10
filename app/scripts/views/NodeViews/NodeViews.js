define(['BaseNodeView', 'WatchNodeView', 'NumNodeView', 'CSGNodeView', 'FormulaView', 'OutputView', 'InputView'], 
  function(BaseNodeView, WatchNodeView, NumNodeView, CSGNodeView, FormulaView, OutputView, InputView){

  var nodeViewTypes = {};

  nodeViewTypes.Base = CSGNodeView;
  nodeViewTypes.Watch = WatchNodeView;
  nodeViewTypes.Number = NumNodeView;

  nodeViewTypes.Formula = FormulaView;
  nodeViewTypes.Input = InputView;
  nodeViewTypes.Output = OutputView;

  return nodeViewTypes;

});