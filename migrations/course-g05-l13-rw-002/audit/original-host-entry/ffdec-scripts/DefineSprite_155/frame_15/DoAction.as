stop();
if(_root.Report_URL == "" || _root.Report_URL == "undefined" || _root.Report_URL == undefined)
{
   _root.setBookMark();
   this.gotoAndStop(1);
}
else
{
   onEnterFrame = function()
   {
      var _loc1_ = _global;
      var _loc2_ = _root;
      if(_loc1_.updatedata == 1)
      {
         elapsedTime = getTimer() - _loc1_.startTime;
         elapsedHours = Math.floor(elapsedTime / 3600000);
         remaining = elapsedTime - elapsedHours * 3600000;
         elapsedM = Math.floor(remaining / 60000);
         remaining -= elapsedM * 60000;
         elapsedS = Math.floor(remaining / 1000);
         remaining -= elapsedS * 1000;
         elapsedH = Math.floor(remaining / 10);
         if(elapsedHours < 10)
         {
            hours = "0" + elapsedHours.toString();
         }
         else
         {
            hours = elapsedHours.toString();
         }
         if(elapsedM < 10)
         {
            minutes = "0" + elapsedM.toString();
         }
         else
         {
            minutes = elapsedM.toString();
         }
         if(elapsedS < 10)
         {
            seconds = "0" + elapsedS.toString();
         }
         else
         {
            seconds = elapsedS.toString();
         }
         if(elapsedH < 10)
         {
            hundredths = "0" + elapsedH.toString();
         }
         else
         {
            hundredths = elapsedH.toString();
         }
         dtfTIMETAKEN1.text = hours + ":" + minutes + ":" + seconds + ":" + hundredths;
         if(seconds > 5)
         {
            if(_loc2_.animation_mc.getBytesLoaded() <= 0)
            {
               _loc1_.Failure = "yes";
               URL = _loc2_.Report_URL + "?" + "&Student_ID=" + _loc2_.Student_ID + "&Class_ID=" + _loc2_.Class_ID + "&Lesson_ID=" + _loc2_.Lesson_ID + "&Section=" + _loc1_.Section + "&FileName=" + _loc1_.FileName + "&Failure=" + _loc1_.Failure + "&Close=" + _loc1_.closeApp + "&Download_Time=";
               _loc1_.BmId = _loc1_.splitStart + "SPLDATA" + _loc1_.splitEnd + "SPLDATA" + _loc1_.sectionNumber + "SPLDATA" + _loc1_.slideNumber + "SPLDATA" + _loc1_.playSwfFileName;
               URL = URL + "&Book_Mark=" + _loc1_.BmId;
               strURL = URL;
               loadVariablesNum(strURL,0,"POST");
               _loc1_.updatedata = 0;
               this.gotoAndStop(1);
            }
            else if(_loc2_.animation_mc.getBytesLoaded() >= _loc2_.animation_mc.getBytesTotal())
            {
               _loc1_.Failure = "no";
               URL = _loc2_.Report_URL + "?" + "&Student_ID=" + _loc2_.Student_ID + "&Class_ID=" + _loc2_.Class_ID + "&Lesson_ID=" + _loc2_.Lesson_ID + "&Section=" + _loc1_.Section + "&FileName=" + _loc1_.FileName + "&Failure=" + _loc1_.Failure + "&Close=" + _loc1_.closeApp + "&Download_Time=" + dtfTIMETAKEN1.text;
               _loc1_.BmId = _loc1_.splitStart + "SPLDATA" + _loc1_.splitEnd + "SPLDATA" + _loc1_.sectionNumber + "SPLDATA" + _loc1_.slideNumber + "SPLDATA" + _loc1_.playSwfFileName;
               URL = URL + "&Bookmark_URL=" + _loc1_.BmId;
               strURL = URL;
               loadVariablesNum(strURL,0,"POST");
               _loc1_.updatedata = 0;
               this.gotoAndStop(1);
            }
         }
      }
   };
}
