if(_root.QuizReport_URL == "" || _root.QuizReport_URL == "undefined" || _root.QuizReport_URL == undefined)
{
   this.gotoAndStop(1);
}
else
{
   finalQuizURL = _root.animation_mc.animation.Mc_Finish.strQuiz_Report_URL;
   loadVariablesNum(finalQuizURL,0,"POST");
   this.gotoAndStop(1);
}
