on(release){
   if(_root.Report_URL == "" || _root.Report_URL == "undefined" || _root.Report_URL == undefined)
   {
      _root.setBookMark();
      _root.doCloseApp();
   }
   else
   {
      _global.closeApp = "yes";
      URL = _root.Report_URL + "?" + "&Student_ID=" + _root.Student_ID + "&Class_ID=" + _root.Class_ID + "&Lesson_ID=" + _root.Lesson_ID + "&Section=" + _global.Section + "&FileName=" + _global.FileName + "&Failure=" + _global.Failure + "&Close=" + _global.closeApp + "&Download_Time=" + dtfTIMETAKEN1.text;
      _global.BmId = _global.splitStart + "SPLDATA" + _global.splitEnd + "SPLDATA" + _global.sectionNumber + "SPLDATA" + _global.slideNumber + "SPLDATA" + _global.playSwfFileName;
      URL = URL + "&Bookmark_URL=" + _global.BmId;
      strURL = URL;
      getURL(strURL,"");
   }
}
