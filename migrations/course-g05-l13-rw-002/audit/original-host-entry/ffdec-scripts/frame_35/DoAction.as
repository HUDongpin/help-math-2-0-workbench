function doCreateSlide()
{
   i = 2;
   while(i < _global.arrSection1_Details.length)
   {
      mcName = _global.arrSection1_Details[i].substring(0,_global.arrSection1_Details[i].length - 4);
      removeMovieClip(mcName);
      i++;
   }
   i = 2;
   while(i < _global.arrSection2_Details.length)
   {
      mcName = _global.arrSection2_Details[i].substring(0,_global.arrSection2_Details[i].length - 4);
      removeMovieClip(mcName);
      i++;
   }
   i = 2;
   while(i < _global.arrSection3_Details.length)
   {
      mcName = _global.arrSection3_Details[i].substring(0,_global.arrSection3_Details[i].length - 4);
      removeMovieClip(mcName);
      i++;
   }
   i = 2;
   while(i < _global.arrSection4_Details.length)
   {
      mcName = _global.arrSection4_Details[i].substring(0,_global.arrSection4_Details[i].length - 4);
      removeMovieClip(mcName);
      i++;
   }
   i = 2;
   while(i < _global.arrSection5_Details.length)
   {
      mcName = _global.arrSection5_Details[i].substring(0,_global.arrSection5_Details[i].length - 4);
      removeMovieClip(mcName);
      i++;
   }
   i = 2;
   while(i < _global.arrSection6_Details.length)
   {
      mcName = _global.arrSection6_Details[i].substring(0,_global.arrSection6_Details[i].length - 4);
      removeMovieClip(mcName);
      i++;
   }
   i = 2;
   while(i < _global.arrSection7_Details.length)
   {
      mcName = _global.arrSection7_Details[i].substring(0,_global.arrSection7_Details[i].length - 4);
      removeMovieClip(mcName);
      i++;
   }
   i = 2;
   while(i < _global.arrSection8_Details.length)
   {
      mcName = _global.arrSection8_Details[i].substring(0,_global.arrSection8_Details[i].length - 4);
      removeMovieClip(mcName);
      i++;
   }
   var §flgExists:Boolean§;
   flgExists = false;
   var §mcName:String§;
   var §intSlideNum:Number§;
   if(_global.sectionNumber == 1)
   {
      slideName = new Array();
      slideName[0] = "Introduction";
      var §slideSpace:Boolean§;
      mcX = 16;
      intSlideNum = 0;
      i = 2;
      while(i < _global.arrSection1_Details.length)
      {
         intSlideNum++;
         mcName = _global.arrSection1_Details[i].substring(0,_global.arrSection1_Details[i].length - 4);
         duplicateMovieClip("_root.Slide_Source",mcName,16384 + intSlideNum);
         eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum - 1];
         if(i == 2)
         {
            eval(mcName)._x = 16;
            eval(mcName)._y = 535;
         }
         else
         {
            slideSpace = false;
            j = 2;
            while(j < _global.arrSSDSec1_Details.length)
            {
               if(_global.arrSSDSec1_Details[j] == intSlideNum)
               {
                  slideSpace = true;
               }
               j++;
            }
            if(slideSpace)
            {
               mcX += 18;
            }
            else
            {
               mcX += 30;
            }
            eval(mcName)._x = mcX;
         }
         eval(mcName).SlideNum._visible = false;
         i++;
      }
      _global.createSlide1 = true;
   }
   if(_global.sectionNumber == 2)
   {
      var §slideSpace:Boolean§;
      mcX = 16;
      intSlideNum = 1;
      slideName = new Array();
      slideName[1] = "Page 1";
      slideName[2] = "Page 2";
      slideName[3] = "Page 3";
      i = 2;
      while(i < _global.arrSection2_Details.length)
      {
         intSlideNum++;
         mcName = _global.arrSection2_Details[i].substring(0,_global.arrSection2_Details[i].length - 4);
         duplicateMovieClip("_root.Slide_Source",mcName,16384 + intSlideNum);
         eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum - 1];
         if(i == 2)
         {
            eval(mcName)._x = 16;
            eval(mcName)._y = 535;
         }
         else
         {
            slideSpace = false;
            j = 2;
            while(j < _global.arrSSDSec2_Details.length)
            {
               if(_global.arrSSDSec2_Details[j] == intSlideNum)
               {
                  slideSpace = true;
               }
               j++;
            }
            if(slideSpace)
            {
               mcX += 18;
            }
            else
            {
               mcX += 30;
            }
            eval(mcName)._x = mcX;
         }
         eval(mcName).SlideNum._visible = false;
         i++;
      }
      _global.createSlide2 = true;
   }
   if(_global.sectionNumber == 3)
   {
      var §slideSpace:Boolean§;
      mcX = 16;
      intSlideNum = 0;
      slideName = new Array();
      slideName[0] = "Introduction";
      slideName[1] = "Angles";
      slideName[2] = "Right Angle, Acute Angle, and Obtuse Angle";
      slideName[3] = "Right Angle, Acute Angle, and Obtuse Angle";
      slideName[4] = "Right Angle, Acute Angle, and Obtuse Angle";
      slideName[5] = "Right Angle, Acute Angle, and Obtuse Angle";
      slideName[6] = "Measure, Degree";
      slideName[7] = "Measure–Practice";
      slideName[8] = "Parallel Lines";
      slideName[9] = "Perpendicular Lines";
      slideName[10] = "Parallel and Perpendicular Lines-Practice";
      slideName[11] = "Parallel and Perpendicular Lines-Practice";
      slideName[12] = "Parallel and Perpendicular Lines-Practice";
      slideName[13] = "Parallel and Perpendicular Lines-Practice";
      slideName[14] = "Quadrilateral and Rectangle";
      slideName[15] = "Quadrilateral and Rectangle-Practice";
      slideName[16] = "Triangle ";
      slideName[17] = "Two-Dimensional";
      slideName[18] = "Three-Dimensional";
      slideName[19] = "Two-Dimensional and Three-Dimensional-Practice";
      if(_global.splitStart == 0 || _global.splitEnd == 0)
      {
         intSlideNum = 0;
         i = 2;
         while(i < _global.arrSection3_Details.length)
         {
            intSlideNum++;
            mcName = _global.arrSection3_Details[i].substring(0,_global.arrSection3_Details[i].length - 4);
            duplicateMovieClip("_root.Slide_Source",mcName,16384 + intSlideNum);
            eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum - 1];
            if(i == 2)
            {
               eval(mcName)._x = 16;
               eval(mcName)._y = 535;
            }
            else
            {
               slideSpace = false;
               j = 2;
               while(j < _global.arrSSDSec3_Details.length)
               {
                  sx = slideName[intSlideNum - 2] + "-Practice";
                  if(slideName[intSlideNum - 1] == slideName[intSlideNum - 2] or sx == slideName[intSlideNum - 1])
                  {
                     slideSpace = true;
                  }
                  j++;
               }
               if(slideSpace)
               {
                  mcX += 15;
               }
               else
               {
                  mcX += 18;
               }
               eval(mcName)._x = mcX;
            }
            eval(mcName).SlideNum._visible = false;
            i++;
         }
         _global.createSlide4 = true;
      }
      else
      {
         intSlideNum = _global.splitStart - 2;
         i = _global.splitStart;
         while(i <= _global.splitEnd)
         {
            trace(_global.splitStart);
            trace(_global.splitEnd);
            intSlideNum++;
            mcName = _global.arrSection3_Details[i].substring(0,_global.arrSection3_Details[i].length - 4);
            duplicateMovieClip("_root.Slide_Source",mcName,16384 + intSlideNum);
            eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum - 1];
            if(i == _global.splitStart)
            {
               eval(mcName)._x = 16;
               eval(mcName)._y = 535;
            }
            else
            {
               slideSpace = false;
               j = 2;
               while(j < _global.arrSSDSec3_Details.length)
               {
                  sx = slideName[intSlideNum - 2] + "-Practice";
                  if(slideName[intSlideNum - 1] == slideName[intSlideNum - 2] or sx == slideName[intSlideNum - 1])
                  {
                     slideSpace = true;
                  }
                  j++;
               }
               if(slideSpace)
               {
                  mcX += 18;
               }
               else
               {
                  mcX += 30;
               }
               eval(mcName)._x = mcX;
            }
            eval(mcName).SlideNum._visible = false;
            i++;
         }
         _global.createSlide3 = true;
      }
   }
   if(_global.sectionNumber == 4)
   {
      var §slideSpace:Boolean§;
      mcX = 16;
      slideName = new Array();
      slideName = new Array();
      slideName[0] = "Introduction";
      slideName[1] = "Identify Angles";
      slideName[2] = "Identify Angles";
      slideName[3] = "Identify Angles";
      slideName[4] = "Identify Angles-Practice";
      slideName[5] = "Draw Angles";
      slideName[6] = "Draw Angles-Practice";
      slideName[7] = "Measure Angles";
      slideName[8] = "Measure Angles";
      slideName[9] = "Measure Angles";
      slideName[10] = "Measure Angles-Practice";
      slideName[11] = "Parallel and Perpendicular Lines";
      slideName[12] = "Parallel and Perpendicular Lines-Practice";
      slideName[13] = "Draw Parallel Lines";
      slideName[14] = "Draw Parallel Lines";
      slideName[15] = "Draw Perpendicular Lines ";
      slideName[16] = "Draw Perpendicular Lines ";
      slideName[17] = "Identify Rectangles as Quadrilaterals";
      slideName[18] = "Draw Rectangles";
      slideName[19] = "Draw Rectangles";
      slideName[20] = "Angle Sums in Quadrilaterals";
      slideName[21] = "Angle Sums in Quadrilaterals–Guided Practice";
      slideName[22] = "Angle Sums in Quadrilaterals-Practice";
      slideName[23] = "Draw Triangles";
      slideName[24] = "Draw Triangles";
      slideName[25] = "Angle Sums in Triangles";
      slideName[26] = "Angle Sums in Triangles-Practice";
      slideName[27] = "Two-Dimensional Drawings of Three-Dimensional Figures";
      slideName[28] = "Two-Dimensional Drawings of Three-Dimensional Figures-Practice";
      slideName[29] = "Two-Dimensional Drawings of Three-Dimensional Figures-Practice";
      if(_global.splitStart == 0 || _global.splitEnd == 0)
      {
         intSlideNum = 0;
         i = 2;
         while(i < _global.arrSection4_Details.length)
         {
            intSlideNum++;
            mcName = _global.arrSection4_Details[i].substring(0,_global.arrSection4_Details[i].length - 4);
            duplicateMovieClip("_root.Slide_Source",mcName,16384 + intSlideNum);
            eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum - 1];
            if(i == 2)
            {
               eval(mcName)._x = 16;
               eval(mcName)._y = 535;
            }
            else
            {
               slideSpace = false;
               j = 2;
               while(j < _global.arrSSDSec4_Details.length)
               {
                  sx = slideName[intSlideNum - 2] + "-Practice";
                  if(slideName[intSlideNum - 1] == slideName[intSlideNum - 2] or sx == slideName[intSlideNum - 1] or intSlideNum == 19 or intSlideNum == 20)
                  {
                     slideSpace = true;
                  }
                  j++;
               }
               if(slideSpace)
               {
                  mcX += 15;
               }
               else
               {
                  mcX += 18;
               }
               eval(mcName)._x = mcX;
            }
            eval(mcName).SlideNum._visible = false;
            i++;
         }
         _global.createSlide4 = true;
      }
      else
      {
         intSlideNum = _global.splitStart - 2;
         i = _global.splitStart;
         while(i <= _global.splitEnd)
         {
            trace(_global.splitStart);
            trace(_global.splitEnd);
            intSlideNum++;
            mcName = _global.arrSection4_Details[i].substring(0,_global.arrSection4_Details[i].length - 4);
            duplicateMovieClip("_root.Slide_Source",mcName,16384 + intSlideNum);
            eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum - 1];
            if(i == _global.splitStart)
            {
               eval(mcName)._x = 16;
               eval(mcName)._y = 535;
            }
            else
            {
               slideSpace = false;
               j = 2;
               while(j < _global.arrSSDSec4_Details.length)
               {
                  sx = slideName[intSlideNum - 2] + "-Practice";
                  if(slideName[intSlideNum - 1] == slideName[intSlideNum - 2] or sx == slideName[intSlideNum - 1] or intSlideNum == 19 or intSlideNum == 20)
                  {
                     slideSpace = true;
                  }
                  j++;
               }
               if(slideSpace)
               {
                  mcX += 18;
               }
               else
               {
                  mcX += 30;
               }
               eval(mcName)._x = mcX;
            }
            eval(mcName).SlideNum._visible = false;
            i++;
         }
         _global.createSlide4 = true;
      }
   }
   if(_global.sectionNumber == 5)
   {
      var §slideSpace:Boolean§;
      mcX = 16;
      intSlideNum = 0;
      slideName = new Array();
      slideName[0] = "Introduction";
      slideName[1] = "Question 1";
      slideName[2] = "Question  2";
      slideName[3] = "Question  3";
      slideName[4] = "Question  4";
      slideName[5] = "Question  5";
      slideName[6] = "Question  6";
      slideName[7] = "Question  7";
      slideName[8] = "Question  8";
      slideName[9] = "Question  9";
      slideName[10] = "Question  10";
      i = 2;
      while(i < _global.arrSection5_Details.length)
      {
         intSlideNum++;
         mcName = _global.arrSection5_Details[i].substring(0,_global.arrSection5_Details[i].length - 4);
         duplicateMovieClip("_root.Slide_Source",mcName,16384 + intSlideNum);
         eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum - 1];
         if(i == 2)
         {
            eval(mcName)._x = 16;
            eval(mcName)._y = 535;
         }
         else
         {
            slideSpace = false;
            j = 2;
            while(j < _global.arrSSDSec5_Details.length)
            {
               if(_global.arrSSDSec5_Details[j] == intSlideNum)
               {
                  slideSpace = true;
               }
               j++;
            }
            if(slideSpace)
            {
               mcX += 16;
            }
            else
            {
               mcX += 37;
            }
            eval(mcName)._x = mcX;
         }
         eval(mcName).SlideNum._visible = false;
         i++;
      }
      _global.createSlide5 = true;
   }
   if(_global.sectionNumber == 6)
   {
      var §slideSpace:Boolean§;
      mcX = 16;
      intSlideNum = 0;
      slideName = new Array();
      slideName[0] = "Introduction";
      slideName[1] = "Game 1";
      i = 2;
      while(i < _global.arrSection6_Details.length)
      {
         intSlideNum++;
         mcName = _global.arrSection6_Details[i].substring(0,_global.arrSection6_Details[i].length - 4);
         duplicateMovieClip("_root.Slide_Source",mcName,16384 + intSlideNum);
         eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum - 1];
         if(i == 2)
         {
            eval(mcName)._x = 16;
            eval(mcName)._y = 535;
         }
         else
         {
            slideSpace = false;
            j = 2;
            while(j < _global.arrSSDSec6_Details.length)
            {
               if(_global.arrSSDSec6_Details[j] == intSlideNum)
               {
                  slideSpace = true;
               }
               j++;
            }
            if(slideSpace)
            {
               mcX += 18;
            }
            else
            {
               mcX += 30;
            }
            eval(mcName)._x = mcX;
         }
         eval(mcName).SlideNum._visible = false;
         i++;
      }
      _global.createSlide6 = true;
   }
   if(_global.sectionNumber == 7)
   {
      var §slideSpace:Boolean§;
      mcX = 16;
      intSlideNum = 0;
      slideName = new Array();
      slideName[0] = "Introduction";
      slideName[1] = "4 - Step Plan";
      slideName[2] = "4 - Step Plan";
      slideName[3] = "4 - Step Plan";
      slideName[4] = "4 - Step Plan";
      slideName[5] = "4 - Step Plan";
      slideName[6] = "Question 1";
      slideName[7] = "Question 2";
      i = 2;
      while(i < _global.arrSection7_Details.length)
      {
         intSlideNum++;
         mcName = _global.arrSection7_Details[i].substring(0,_global.arrSection7_Details[i].length - 4);
         duplicateMovieClip("_root.Slide_Source",mcName,16384 + intSlideNum);
         eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum - 1];
         if(i == 2)
         {
            eval(mcName)._x = 16;
            eval(mcName)._y = 535;
         }
         else
         {
            slideSpace = false;
            j = 2;
            while(j < _global.arrSSDSec7_Details.length)
            {
               if(_global.arrSSDSec7_Details[j] == intSlideNum)
               {
                  slideSpace = true;
               }
               j++;
            }
            if(slideSpace)
            {
               mcX += 18;
            }
            else
            {
               mcX += 30;
            }
            eval(mcName)._x = mcX;
         }
         eval(mcName).SlideNum._visible = false;
         i++;
      }
      _global.createSlide7 = true;
   }
   if(_global.sectionNumber == 8)
   {
      var §slideSpace:Boolean§;
      mcX = 16;
      intSlideNum = 0;
      slideName = new Array();
      slideName[0] = "Introduction";
      slideName[1] = "Page 1";
      slideName[2] = "Page 2";
      i = 2;
      while(i < _global.arrSection8_Details.length)
      {
         intSlideNum++;
         mcName = _global.arrSection8_Details[i].substring(0,_global.arrSection8_Details[i].length - 4);
         duplicateMovieClip("_root.Slide_Source",mcName,16384 + intSlideNum);
         eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum - 1];
         if(i == 2)
         {
            eval(mcName)._x = 16;
            eval(mcName)._y = 535;
         }
         else
         {
            slideSpace = false;
            j = 2;
            while(j < _global.arrSSDSec8_Details.length)
            {
               if(_global.arrSSDSec8_Details[j] == intSlideNum)
               {
                  slideSpace = true;
               }
               j++;
            }
            if(slideSpace)
            {
               mcX += 18;
            }
            else
            {
               mcX += 30;
            }
            eval(mcName)._x = mcX;
         }
         eval(mcName).SlideNum._visible = false;
         i++;
      }
      _global.createSlide8 = true;
   }
}
function doPlayPreviousMovie()
{
   var _loc1_ = _global;
   var _loc2_ = _root;
   _loc1_.Play = true;
   _loc1_.Pause = false;
   _loc1_.CompClick = "";
   _loc1_.quizSection = false;
   _loc1_.needMoreBackURL = "";
   _loc1_.slideNumber = _loc1_.slideNumber - 1;
   _loc2_.animation_mc.unloadMovie();
   _loc2_.glossary.keyterms.mouse_down._x = _loc2_.glossary.keyterms.x_pos;
   _loc2_.glossary.keyterms.mouse_down._y = _loc2_.glossary.keyterms.y_pos;
   _loc2_.glossary._visible = false;
   _loc2_.calculator._visible = false;
   _loc2_.m_c._visible = false;
   _loc2_.popup.gotoAndStop(1);
   _loc2_.next_mc.gotoAndStop("inactive");
   _loc2_.replay_mc.gotoAndStop("inactive");
   if(_loc1_.sectionNumber == 1)
   {
      if(_loc1_.slideNumber < 2)
      {
         _loc1_.sectionNumber = 1;
         _loc1_.slideNumber = 2;
      }
      _loc1_.playSwfFileName = _loc1_.tempURL + "/IR/" + _loc1_.arrSection1_Details[_loc1_.slideNumber];
      _loc2_.loadSWFMovie();
   }
   if(_loc1_.sectionNumber == 2)
   {
      if(_loc1_.slideNumber < 2)
      {
         _loc1_.sectionNumber = 1;
         _loc1_.slideNumber = _loc1_.arrSection1_Details.length - 1;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/IR/" + _loc1_.arrSection1_Details[_loc1_.slideNumber];
         _loc2_.doCreateSlide();
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
      else
      {
         _loc1_.playSwfFileName = _loc1_.tempURL + "/RW/" + _loc1_.arrSection2_Details[_loc1_.slideNumber];
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
   }
   if(_loc1_.sectionNumber == 3)
   {
      if(_loc1_.slideNumber < 2)
      {
         _loc1_.sectionNumber = 2;
         _loc1_.slideNumber = _loc1_.arrSection2_Details.length - 1;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/RW/" + _loc1_.arrSection2_Details[_loc1_.slideNumber];
         _loc2_.doCreateSlide();
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
      else if(_loc1_.slideNumber > 11)
      {
         _loc1_.splitStart = 12;
         _loc1_.splitEnd = 21;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/VB/" + _loc1_.arrSection3_Details[_loc1_.slideNumber];
         _loc2_.doCreateSlide();
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
      else
      {
         _loc1_.splitStart = 2;
         _loc1_.splitEnd = 11;
         _loc2_.doCreateSlide();
         _loc1_.playSwfFileName = _loc1_.tempURL + "/VB/" + _loc1_.arrSection3_Details[_loc1_.slideNumber];
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
   }
   if(_loc1_.sectionNumber == 4)
   {
      if(_loc1_.slideNumber == 16)
      {
         _loc1_.splitStart = 2;
         _loc1_.splitEnd = 16;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/IN/" + _loc1_.arrSection4_Details[_loc1_.slideNumber];
         _loc2_.doCreateSlide();
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
      if(_loc1_.slideNumber < 2)
      {
         _loc1_.sectionNumber = 3;
         _loc1_.slideNumber = _loc1_.arrSection3_Details.length - 1;
         _loc1_.splitStart = 12;
         _loc1_.splitEnd = 21;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/VB/" + _loc1_.arrSection3_Details[_loc1_.slideNumber];
         _loc2_.doCreateSlide();
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
      else
      {
         _loc1_.playSwfFileName = _loc1_.tempURL + "/IN/" + _loc1_.arrSection4_Details[_loc1_.slideNumber];
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
   }
   if(_loc1_.sectionNumber == 5)
   {
      if(_loc1_.slideNumber < 2)
      {
         _loc1_.sectionNumber = 4;
         _loc1_.splitStart = 16;
         _loc1_.splitEnd = 31;
         _loc1_.slideNumber = _loc1_.arrSection4_Details.length - 1;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/IN/" + _loc1_.arrSection4_Details[_loc1_.slideNumber];
         _loc2_.doCreateSlide();
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
      else
      {
         _loc1_.playSwfFileName = _loc1_.tempURL + "/TI/" + _loc1_.arrSection5_Details[_loc1_.slideNumber];
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
   }
   if(_loc1_.sectionNumber == 6)
   {
      if(_loc1_.slideNumber < 2)
      {
         _loc1_.sectionNumber = 5;
         _loc1_.slideNumber = _loc1_.arrSection5_Details.length - 1;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/TI/" + _loc1_.arrSection5_Details[_loc1_.slideNumber];
         _loc2_.doCreateSlide();
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
      else
      {
         _loc1_.playSwfFileName = _loc1_.tempURL + "/GS/" + _loc1_.arrSection6_Details[_loc1_.slideNumber];
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
   }
   if(_loc1_.sectionNumber == 7)
   {
      if(_loc1_.slideNumber < 2)
      {
         _loc1_.sectionNumber = 6;
         _loc1_.slideNumber = _loc1_.arrSection6_Details.length - 1;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/GS/" + _loc1_.arrSection6_Details[_loc1_.slideNumber];
         _loc2_.doCreateSlide();
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
      else
      {
         _loc1_.playSwfFileName = _loc1_.tempURL + "/TS/" + _loc1_.arrSection7_Details[_loc1_.slideNumber];
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
   }
   if(_loc1_.sectionNumber == 8)
   {
      if(_loc1_.slideNumber < 2)
      {
         _loc1_.sectionNumber = 7;
         _loc1_.slideNumber = _loc1_.arrSection7_Details.length - 1;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/TS/" + _loc1_.arrSection7_Details[_loc1_.slideNumber];
         _loc2_.doCreateSlide();
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
      else
      {
         _loc1_.playSwfFileName = _loc1_.tempURL + "/FQ/" + _loc1_.arrSection8_Details[_loc1_.slideNumber];
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
   }
}
function doPlayNextMovie()
{
   var _loc1_ = _global;
   var _loc2_ = _root;
   _loc1_.Play = true;
   _loc1_.Pause = false;
   _loc1_.CompClick = "";
   _loc1_.quizSection = false;
   _loc1_.needMoreBackURL = "";
   _loc1_.slideNumber = _loc1_.slideNumber + 1;
   _loc2_.animation_mc.unloadMovie();
   _loc2_.glossary.keyterms.mouse_down._x = _loc2_.glossary.keyterms.x_pos;
   _loc2_.glossary.keyterms.mouse_down._y = _loc2_.glossary.keyterms.y_pos;
   _loc2_.glossary._visible = false;
   _loc2_.calculator._visible = false;
   _loc2_.m_c._visible = false;
   _loc2_.popup.gotoAndStop(1);
   _loc2_.next.gotoAndStop("inactive");
   _loc2_.replay.gotoAndStop("inactive");
   if(_loc1_.sectionNumber == 1)
   {
      if(_loc1_.slideNumber > _loc1_.arrSection1_Details.length - 1)
      {
         _loc1_.sectionNumber = 2;
         _loc1_.slideNumber = 2;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/RW/" + _loc1_.arrSection2_Details[_loc1_.slideNumber];
         _loc2_.doCreateSlide();
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
      else
      {
         _loc1_.playSwfFileName = _loc1_.tempURL + "/IR/" + _loc1_.arrSection1_Details[_loc1_.slideNumber];
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
   }
   if(_loc1_.sectionNumber == 2)
   {
      if(_loc1_.slideNumber > _loc1_.arrSection2_Details.length - 1)
      {
         _loc1_.sectionNumber = 3;
         _loc1_.slideNumber = 2;
         _loc1_.splitStart = 2;
         _loc1_.splitEnd = 11;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/VB/" + _loc1_.arrSection3_Details[_loc1_.slideNumber];
         _loc2_.doCreateSlide();
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
      else
      {
         _loc1_.playSwfFileName = _loc1_.tempURL + "/RW/" + _loc1_.arrSection2_Details[_loc1_.slideNumber];
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
   }
   if(_loc1_.sectionNumber == 3)
   {
      if(_loc1_.slideNumber > _loc1_.arrSection3_Details.length - 1)
      {
         _loc1_.sectionNumber = 4;
         _loc1_.slideNumber = 2;
         _loc1_.splitStart = 2;
         _loc1_.splitEnd = 16;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/IN/" + _loc1_.arrSection4_Details[_loc1_.slideNumber];
         _loc2_.doCreateSlide();
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
      else if(_loc1_.slideNumber > 11)
      {
         _loc1_.splitStart = 12;
         _loc1_.splitEnd = 21;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/VB/" + _loc1_.arrSection3_Details[_loc1_.slideNumber];
         _loc2_.doCreateSlide();
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
      else
      {
         _loc1_.splitStart = 2;
         _loc1_.splitEnd = 11;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/VB/" + _loc1_.arrSection3_Details[_loc1_.slideNumber];
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
   }
   if(_loc1_.sectionNumber == 4)
   {
      if(_loc1_.slideNumber > 16)
      {
         _loc1_.splitStart = 17;
         _loc1_.splitEnd = 31;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/IN/" + _loc1_.arrSection4_Details[_loc1_.slideNumber];
         _loc2_.doCreateSlide();
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
      if(_loc1_.slideNumber > _loc1_.arrSection4_Details.length - 1)
      {
         _loc1_.sectionNumber = 5;
         _loc1_.slideNumber = 2;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/TI/" + _loc1_.arrSection5_Details[_loc1_.slideNumber];
         _loc2_.doCreateSlide();
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
      else
      {
         _loc1_.playSwfFileName = _loc1_.tempURL + "/IN/" + _loc1_.arrSection4_Details[_loc1_.slideNumber];
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
   }
   if(_loc1_.sectionNumber == 5)
   {
      if(_loc1_.slideNumber > _loc1_.arrSection5_Details.length - 1)
      {
         _loc1_.sectionNumber = 6;
         _loc1_.slideNumber = 2;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/GS/" + _loc1_.arrSection6_Details[_loc1_.slideNumber];
         _loc2_.doCreateSlide();
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
      else
      {
         _loc1_.playSwfFileName = _loc1_.tempURL + "/TI/" + _loc1_.arrSection5_Details[_loc1_.slideNumber];
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
   }
   if(_loc1_.sectionNumber == 6)
   {
      if(_loc1_.slideNumber > _loc1_.arrSection6_Details.length - 1)
      {
         _loc1_.sectionNumber = 7;
         _loc1_.slideNumber = 2;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/TS/" + _loc1_.arrSection7_Details[_loc1_.slideNumber];
         _loc2_.doCreateSlide();
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
      else
      {
         _loc1_.playSwfFileName = _loc1_.tempURL + "/GS/" + _loc1_.arrSection6_Details[_loc1_.slideNumber];
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
   }
   if(_loc1_.sectionNumber == 7)
   {
      if(_loc1_.slideNumber > _loc1_.arrSection7_Details.length - 1)
      {
         _loc1_.sectionNumber = 8;
         _loc1_.slideNumber = 2;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/FQ/" + _loc1_.arrSection8_Details[_loc1_.slideNumber];
         _loc2_.doCreateSlide();
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
      else
      {
         _loc1_.playSwfFileName = _loc1_.tempURL + "/TS/" + _loc1_.arrSection7_Details[_loc1_.slideNumber];
         _loc2_.doPutBackAndFinished();
         _loc2_.loadSWFMovie();
      }
   }
   if(_loc1_.sectionNumber == 8)
   {
      if(_loc1_.slideNumber > _loc1_.arrSection8_Details.length - 1)
      {
         _loc1_.sectionNumber = 8;
         _loc1_.slideNumber = _loc1_.arrSection8_Details.length - 1;
      }
      _loc1_.playSwfFileName = _loc1_.tempURL + "/FQ/" + _loc1_.arrSection8_Details[_loc1_.slideNumber];
      _loc2_.doPutBackAndFinished();
      _loc2_.loadSWFMovie();
   }
}
function doCheckSpanishAudio()
{
   var _loc1_ = _root;
   var _loc2_ = _global;
   _loc1_.dtfSPANISH.text = "ON";
   if(_loc1_.dtfSPANISH.text == "ON")
   {
      if(_loc2_.spanSound != true)
      {
         if(_loc2_.sectionNumber == 2 || _loc2_.sectionNumber == 3 || _loc2_.sectionNumber == 4 || _loc2_.sectionNumber == 5 || _loc2_.sectionNumber == 6 || _loc2_.sectionNumber == 7)
         {
            if(_loc2_.playSwfFileName != _loc2_.tempURL + "/RW/L13RW01.swf" && _loc2_.playSwfFileName != _loc2_.tempURL + "/VB/L13VB01.swf" && _loc2_.playSwfFileName != _loc2_.tempURL + "/IN/L13IN01.swf" && _loc2_.playSwfFileName != _loc2_.tempURL + "/GS/L13GS01.swf" && _loc2_.playSwfFileName != _loc2_.tempURL + "/TI/L13TI01.swf" && _loc2_.playSwfFileName != _loc2_.tempURL + "/TS/L13TS01.swf")
            {
               _loc1_.SA._visible = true;
               _loc1_.EA._visible = true;
               _loc1_.SA_PLAY._visible = false;
               _loc1_.SA_PAUSE._visible = false;
               _loc1_.SA._alpha = 100;
               _loc1_.EA._alpha = 100;
            }
            else
            {
               _loc1_.SA._visible = false;
               _loc1_.EA._visible = false;
               _loc1_.SA_PLAY._visible = false;
               _loc1_.SA_PAUSE._visible = false;
               _loc1_.SA._alpha = 0;
               _loc1_.EA._alpha = 0;
            }
         }
         else
         {
            _loc1_.SA._visible = false;
            _loc1_.EA._visible = false;
            _loc1_.SA_PLAY._visible = false;
            _loc1_.SA_PAUSE._visible = false;
            _loc1_.SA._alpha = 0;
            _loc1_.EA._alpha = 0;
         }
      }
   }
   else
   {
      _loc1_.SA._visible = false;
      _loc1_.EA._visible = false;
      _loc1_.SA_PLAY._visible = false;
      _loc1_.SA_PAUSE._visible = false;
      _loc1_.SA._alpha = 0;
      _loc1_.EA._alpha = 0;
   }
}
function getBookMark()
{
   var _loc1_ = _global;
   var _loc2_ = _root;
   for(var _loc3_ in myCookie.data)
   {
      _loc1_.arrayFLCookie.push(myCookie.data[_loc3_]);
      tempFLCookieCount++;
   }
   lessonNum = _loc2_.Lesson_ID;
   i = 0;
   if(i < _loc1_.arrayFLCookie.length)
   {
      tempSplFLC = _loc1_.arrayFLCookie[i].split("~");
      tempFLCCheckVal = "L" add lessonNum;
      if(tempFLCCheckVal == tempSplFLC[0])
      {
         _loc2_.Bookmark_URL = tempSplFLC[1];
      }
   }
}
function setBookMark()
{
   var _loc1_ = _global;
   lessonNum = _root.Lesson_ID;
   tempINFLCVal = "L" add lessonNum;
   myCookie.clear();
   i = 0;
   if(i < _loc1_.arrayFLCookie.length)
   {
      tempSplFLC = _loc1_.arrayFLCookie[i].split("~");
      tempFLCCheckVal = "L" add lessonNum;
      if(tempFLCCheckVal == tempSplFLC[0])
      {
         _loc1_.arrayFLCookie.splice(i,1);
      }
   }
   _loc1_.BmId = _loc1_.splitStart + "SPLDATA" + _loc1_.splitEnd + "SPLDATA" + _loc1_.sectionNumber + "SPLDATA" + _loc1_.slideNumber + "SPLDATA" + _loc1_.playSwfFileName;
   _loc1_.arrayFLCookie.push(tempINFLCVal add "~" add _loc1_.BmId);
   i = 0;
   while(i < _loc1_.arrayFLCookie.length)
   {
      myCookie.data[i] = _loc1_.arrayFLCookie[i];
      myCookie.flush();
      i++;
   }
}
function loadSWFMovie()
{
   var _loc1_ = _global;
   var _loc2_ = _root;
   _loc2_.SA._visible = false;
   _loc2_.EA._visible = false;
   _loc2_.SA_PLAY._visible = false;
   _loc2_.SA_PAUSE._visible = false;
   _loc1_.showWarnText = 1;
   _loc2_.animation_mc.unloadMovie();
   _loc2_.WarnText = "Loading page. Please wait...";
   ss = new Sound();
   ss.setVolume(_loc1_.VolLevel);
   ss = new Sound();
   ss.setVolume(_loc1_.VolLevel);
   _loc1_.startTime = getTimer();
   _loc1_.gSound.stop();
   _loc2_.doCheckBGText();
   var timing = false;
   var paused = false;
   var remaining;
   var elapsedTime;
   var elapsedHours;
   var elapsedM;
   var elapsedS;
   var §elapsedH:Number§;
   var §remaining:Number§;
   var §hours:String§;
   var §minutes:String§;
   var §seconds:String§;
   var §hundredths:String§;
   if(_loc1_.sectionNumber == 1)
   {
      _loc1_.Section = "Introduction";
   }
   if(_loc1_.sectionNumber == 2)
   {
      _loc1_.timing1 = true;
      _loc1_.timing2 = false;
      _loc1_.timing3 = false;
      _loc1_.timing4 = false;
      _loc1_.timing5 = false;
      _loc1_.timing6 = false;
      _loc1_.timing7 = false;
      _loc1_.Section = "Real World";
      _loc2_.dtfSECTION1.text = _loc1_.Section;
   }
   if(_loc1_.sectionNumber == 3)
   {
      _loc1_.timing1 = false;
      _loc1_.timing2 = true;
      _loc1_.timing3 = false;
      _loc1_.timing4 = false;
      _loc1_.timing5 = false;
      _loc1_.timing6 = false;
      _loc1_.timing7 = false;
      _loc1_.Section = "Vocabulary";
      _loc2_.dtfSECTION2.text = _loc1_.Section;
   }
   if(_loc1_.sectionNumber == 4)
   {
      _loc1_.timing1 = false;
      _loc1_.timing2 = false;
      _loc1_.timing3 = true;
      _loc1_.timing4 = false;
      _loc1_.timing5 = false;
      _loc1_.timing6 = false;
      _loc1_.timing7 = false;
      _loc1_.Section = "Instruction";
      _loc2_.dtfSECTION3.text = _loc1_.Section;
   }
   if(_loc1_.sectionNumber == 5)
   {
      _loc1_.timing1 = false;
      _loc1_.timing2 = false;
      _loc1_.timing3 = false;
      _loc1_.timing4 = true;
      _loc1_.timing5 = false;
      _loc1_.timing6 = false;
      _loc1_.timing7 = false;
      _loc1_.Section = "Try It";
      _loc2_.dtfSECTION4.text = _loc1_.Section;
   }
   if(_loc1_.sectionNumber == 6)
   {
      _loc1_.timing1 = false;
      _loc1_.timing2 = false;
      _loc1_.timing3 = false;
      _loc1_.timing4 = false;
      _loc1_.timing5 = true;
      _loc1_.timing6 = false;
      _loc1_.timing7 = false;
      _loc1_.Section = "Games";
      _loc2_.dtfSECTION5.text = _loc1_.Section;
   }
   if(_loc1_.sectionNumber == 7)
   {
      _loc1_.timing1 = false;
      _loc1_.timing2 = false;
      _loc1_.timing3 = false;
      _loc1_.timing4 = false;
      _loc1_.timing5 = false;
      _loc1_.timing6 = true;
      _loc1_.timing7 = false;
      _loc1_.Section = "Test and Skills";
      _loc2_.dtfSECTION6.text = _loc1_.Section;
   }
   if(_loc1_.sectionNumber == 8)
   {
      _loc1_.timing1 = false;
      _loc1_.timing2 = false;
      _loc1_.timing3 = false;
      _loc1_.timing4 = false;
      _loc1_.timing5 = false;
      _loc1_.timing6 = false;
      _loc1_.timing7 = true;
      _loc1_.Section = "Final Quiz";
      _loc2_.dtfSECTION7.text = _loc1_.Section;
   }
   _loc1_.updatedata = 1;
   _loc1_.FileName = _loc1_.playSwfFileName;
   _loc2_.Mc_Data_Update.gotoAndPlay(6);
   _loc2_.animation_mc.loadMovie(_loc1_.playSwfFileName,1);
}
function setSpanishPopUp(mcTarget, frameLbl)
{
   startDrag(mcTarget,1);
   tellTarget(mcTarget)
   {
      eval(mcTarget).gotoAndPlay(frameLbl);
   }
}
function unSetSpanishPopUp(mcTarget, frameLbl)
{
   eval(mcTarget).gotoAndStop(frameLbl);
}
function loadAnimationPage(splitStart, splitEnd, mcPageName)
{
   var _loc1_ = _root;
   var _loc2_ = _global;
   _loc2_.splitStart = splitStart;
   _loc2_.splitEnd = splitEnd;
   stopDrag();
   _loc1_.mover_mc.gotoAndStop("inactive");
   _loc2_.Play = true;
   _loc2_.Pause = false;
   _loc2_.CompClick = "";
   _loc1_.doGetSwfFileName(mcPageName);
   _loc1_.doCreateSlide();
   _loc1_.doPutBackAndFinished();
   _loc1_.loadSWFMovie();
   _loc1_.popup.gotoAndStop(1);
   _loc1_.map.enabled = true;
   _loc1_.m1_l1.gotoAndStop("map");
}
function showWrongFeed()
{
   intMc_Name = random(3);
   intMc_Name += 1;
   eval("_root.animation_mc.animation.Mc_Wrong_Feed" + intMc_Name)._visible = true;
   eval("_root.animation_mc.animation.Mc_Wrong_Feed" + intMc_Name).gotoAndPlay(2);
   _global.gSound.setVolume(_global.volLevel);
}
function showRightFeed()
{
   intMc_Name = random(4);
   intMc_Name += 1;
   eval("_root.animation_mc.animation.Mc_Right_Feed" + intMc_Name)._visible = true;
   eval("_root.animation_mc.animation.Mc_Right_Feed" + intMc_Name).gotoAndPlay(2);
   _global.gSound.setVolume(_global.volLevel);
}
function disableQuizButton()
{
   i = 1;
   while(i <= 25)
   {
      eval("_root.animation_mc.animation.AnsBtn" + i).enabled = false;
      eval("_root.animation_mc.animation.AnsBtn" + i)._visible = false;
      eval("_root.animation_mc.animation.AnsBtn" + i)._visible = false;
      i++;
   }
   _root.animation_mc.animation.NMHBtn.enabled = false;
}
function enableQuizButton()
{
   i = 1;
   while(i <= 25)
   {
      eval("_root.animation_mc.animation.AnsBtn" + i).enabled = true;
      eval("_root.animation_mc.animation.AnsBtn" + i)._visible = true;
      i++;
   }
   _root.animation_mc.animation.NMHBtn.enabled = true;
}
function doSlideCheck()
{
   var _loc1_ = _global;
   var _loc2_ = this;
   var §flgExists:Boolean§;
   flgExists = false;
   i = 0;
   while(i < _loc1_.arrFinishSlide.length)
   {
      if(_loc1_.arrFinishSlide[i] == _loc2_._name)
      {
         flgExists = true;
      }
      i++;
   }
   if(flgExists)
   {
      finishColor = new Color(_loc2_);
      finishColor.setRGB(16737792);
   }
   else
   {
      finishColor = new Color(_loc2_);
      finishColor.setRGB(13297913);
   }
   var §splTempChkName:Array§;
   splTempChkName = _loc1_.playSwfFileName.substring(0,_loc1_.playSwfFileName.length - 4).split("/");
   if(splTempChkName[splTempChkName.lenght - 1] == _loc2_._name)
   {
      finishColor = new Color(_loc2_);
      finishColor.setRGB(16776960);
      _loc2_.SlideNum._visible = true;
   }
   else
   {
      _loc2_.SlideNum._visible = false;
   }
}
function doSlideClick()
{
   var _loc1_ = _global;
   var _loc2_ = this;
   var _loc3_ = _root;
   _loc3_.glossary._visible = false;
   _loc3_.calculator._visible = false;
   _loc3_.next.gotoAndStop("inactive");
   _loc3_.replay.gotoAndStop("inactive");
   _loc3_.popup.gotoAndStop(1);
   if(_loc1_.sectionNumber == 1)
   {
      _loc1_.playSwfFileName = _loc1_.tempURL + "/IR/" + _loc2_._name + ".swf";
      i = 2;
      while(i < _loc1_.arrSection1_Details.length)
      {
         if(_loc1_.arrSection1_Details[i] == _loc2_._name + ".swf")
         {
            _loc1_.slideNumber = i;
         }
         i++;
      }
   }
   if(_loc1_.sectionNumber == 2)
   {
      _loc1_.playSwfFileName = _loc1_.tempURL + "/RW/" + _loc2_._name + ".swf";
      i = 2;
      while(i < _loc1_.arrSection2_Details.length)
      {
         if(_loc1_.arrSection2_Details[i] == _loc2_._name + ".swf")
         {
            _loc1_.slideNumber = i;
         }
         i++;
      }
   }
   if(_loc1_.sectionNumber == 3)
   {
      _loc1_.playSwfFileName = _loc1_.tempURL + "/VB/" + _loc2_._name + ".swf";
      i = 2;
      while(i < _loc1_.arrSection3_Details.length)
      {
         if(_loc1_.arrSection3_Details[i] == _loc2_._name + ".swf")
         {
            _loc1_.slideNumber = i;
         }
         i++;
      }
   }
   if(_loc1_.sectionNumber == 4)
   {
      _loc1_.playSwfFileName = _loc1_.tempURL + "/IN/" + _loc2_._name + ".swf";
      i = 2;
      while(i < _loc1_.arrSection4_Details.length)
      {
         if(_loc1_.arrSection4_Details[i] == _loc2_._name + ".swf")
         {
            _loc1_.slideNumber = i;
         }
         i++;
      }
   }
   if(_loc1_.sectionNumber == 5)
   {
      _loc1_.playSwfFileName = _loc1_.tempURL + "/TI/" + _loc2_._name + ".swf";
      i = 2;
      while(i < _loc1_.arrSection5_Details.length)
      {
         if(_loc1_.arrSection5_Details[i] == _loc2_._name + ".swf")
         {
            _loc1_.slideNumber = i;
         }
         i++;
      }
   }
   if(_loc1_.sectionNumber == 6)
   {
      _loc1_.playSwfFileName = _loc1_.tempURL + "/GS/" + _loc2_._name + ".swf";
      i = 2;
      while(i < _loc1_.arrSection6_Details.length)
      {
         if(_loc1_.arrSection6_Details[i] == _loc2_._name + ".swf")
         {
            _loc1_.slideNumber = i;
         }
         i++;
      }
   }
   if(_loc1_.sectionNumber == 7)
   {
      _loc1_.playSwfFileName = _loc1_.tempURL + "/TS/" + _loc2_._name + ".swf";
      i = 2;
      while(i < _loc1_.arrSection7_Details.length)
      {
         if(_loc1_.arrSection7_Details[i] == _loc2_._name + ".swf")
         {
            _loc1_.slideNumber = i;
         }
         i++;
      }
   }
   if(_loc1_.sectionNumber == 8)
   {
      _loc1_.playSwfFileName = _loc1_.tempURL + "/FQ/" + _loc2_._name + ".swf";
      i = 2;
      while(i < _loc1_.arrSection8_Details.length)
      {
         if(_loc1_.arrSection8_Details[i] == _loc2_._name + ".swf")
         {
            _loc1_.slideNumber = i;
         }
         i++;
      }
   }
   _loc3_.doPutBackAndFinished();
   _loc3_.loadSWFMovie();
}
function doMapClickEnableAll()
{
   var _loc1_ = _global;
   _loc1_.Play = true;
   _loc1_.Pause = false;
   _loc1_.CompClick = "";
   _root.m1_l1.gotoAndStop("m1_l1_content");
   _root.m1_l1._visible = false;
   _loc1_.needMoreBackURL = "";
}
function doNeedMoreHelp(strScrName, framePlay)
{
   var _loc1_ = _global;
   var _loc2_ = strScrName;
   _loc1_.quizSection = false;
   i = 2;
   while(i < _loc1_.arrSection1_Details.length)
   {
      if(_loc1_.arrSection1_Details[i] == _loc2_ + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 1;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/IR/" + _loc2_ + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection2_Details.length)
   {
      if(_loc1_.arrSection2_Details[i] == _loc2_ + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 2;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/RW/" + _loc2_ + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection3_Details.length)
   {
      if(_loc1_.arrSection3_Details[i] == _loc2_ + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 3;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/VB/" + _loc2_ + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection4_Details.length)
   {
      if(_loc1_.arrSection4_Details[i] == _loc2_ + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 4;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/IN/" + _loc2_ + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection5_Details.length)
   {
      if(_loc1_.arrSection5_Details[i] == _loc2_ + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 5;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/TI/" + _loc2_ + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection6_Details.length)
   {
      if(_loc1_.arrSection6_Details[i] == _loc2_ + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 6;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/GS/" + _loc2_ + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection7_Details.length)
   {
      if(_loc1_.arrSection7_Details[i] == _loc2_ + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 7;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/TS/" + _loc2_ + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection8_Details.length)
   {
      if(_loc1_.arrSection8_Details[i] == _loc2_ + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 8;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/FQ/" + _loc2_ + ".swf";
      }
      i++;
   }
   _root.doCreateSlide();
   _root.loadSWFMovie();
}
function doBackClick()
{
   var _loc1_ = _global;
   _loc1_.Play = true;
   _loc1_.Pause = false;
   _loc1_.CompClick = "";
   _loc1_.quizSection = false;
   i = 2;
   while(i < _loc1_.arrSection1_Details.length)
   {
      if(_loc1_.arrSection1_Details[i] == _loc1_.arrGoBack[_loc1_.arrGoBack.length - 2] + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 1;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/IR/" + _loc1_.arrGoBack[_loc1_.arrGoBack.length - 2] + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection2_Details.length)
   {
      if(_loc1_.arrSection2_Details[i] == _loc1_.arrGoBack[_loc1_.arrGoBack.length - 2] + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 2;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/RW/" + _loc1_.arrGoBack[_loc1_.arrGoBack.length - 2] + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection3_Details.length)
   {
      if(_loc1_.arrSection3_Details[i] == _loc1_.arrGoBack[_loc1_.arrGoBack.length - 2] + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 3;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/VB/" + _loc1_.arrGoBack[_loc1_.arrGoBack.length - 2] + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection4_Details.length)
   {
      if(_loc1_.arrSection4_Details[i] == _loc1_.arrGoBack[_loc1_.arrGoBack.length - 2] + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 4;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/IN/" + _loc1_.arrGoBack[_loc1_.arrGoBack.length - 2] + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection5_Details.length)
   {
      if(_loc1_.arrSection5_Details[i] == _loc1_.arrGoBack[_loc1_.arrGoBack.length - 2] + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 5;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/TI/" + _loc1_.arrGoBack[_loc1_.arrGoBack.length - 2] + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection6_Details.length)
   {
      if(_loc1_.arrSection6_Details[i] == _loc1_.arrGoBack[_loc1_.arrGoBack.length - 2] + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 6;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/GS/" + _loc1_.arrGoBack[_loc1_.arrGoBack.length - 2] + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection7_Details.length)
   {
      if(_loc1_.arrSection7_Details[i] == _loc1_.arrGoBack[_loc1_.arrGoBack.length - 2] + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 7;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/TS/" + _loc1_.arrGoBack[_loc1_.arrGoBack.length - 2] + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection8_Details.length)
   {
      if(_loc1_.arrSection8_Details[i] == _loc1_.arrGoBack[_loc1_.arrGoBack.length - 2] + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 8;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/FQ/" + _loc1_.arrGoBack[_loc1_.arrGoBack.length - 2] + ".swf";
      }
      i++;
   }
   _loc1_.arrGoBack.pop(_loc1_.arrGoBack.length);
   _root.doCreateSlide();
   _root.loadSWFMovie();
}
function doMapClick()
{
   var _loc1_ = _global;
   var _loc2_ = _root;
   var §mcClipName:String§;
   mcClipName = this._name;
   i = 2;
   while(i < _loc1_.arrSection1_Details.length)
   {
      if(_loc1_.arrSection1_Details[i] == mcClipName + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 1;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/IR/" + mcClipName + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection2_Details.length)
   {
      if(_loc1_.arrSection2_Details[i] == mcClipName + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 2;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/RW/" + mcClipName + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection3_Details.length)
   {
      if(_loc1_.arrSection3_Details[i] == mcClipName + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 3;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/VB/" + mcClipName + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection4_Details.length)
   {
      if(_loc1_.arrSection4_Details[i] == mcClipName + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 4;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/IN/" + mcClipName + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection5_Details.length)
   {
      if(_loc1_.arrSection5_Details[i] == mcClipName + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 5;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/TI/" + mcClipName + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection6_Details.length)
   {
      if(_loc1_.arrSection6_Details[i] == mcClipName + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 6;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/GS/" + mcClipName + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection7_Details.length)
   {
      if(_loc1_.arrSection7_Details[i] == mcClipName + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 7;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/TS/" + mcClipName + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection8_Details.length)
   {
      if(_loc1_.arrSection8_Details[i] == mcClipName + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 8;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/FQ/" + mcClipName + ".swf";
      }
      i++;
   }
   _loc2_.doCreateSlide();
   _loc2_.doPutBackAndFinished();
   _loc2_.loadSWFMovie();
   _loc2_.popup.gotoAndStop(1);
   _loc2_.map.enabled = true;
   _loc2_.m1_l1.gotoAndStop("map");
   _loc2_.mover_mc.gotoAndStop("inactive");
}
function doCheckPrevAndNext()
{
   splitRootURL = _global.playSwfFileName.split("/");
   splitFileName = splitRootURL[splitRootURL.length - 1].split("FQ");
   strTempLID = splitFileName[0];
   i = 0;
   while(i < splitRootURL.length)
   {
      if(splitRootURL.indexOf("FQ02") != -1)
      {
         strTempURL = splitRootURL(i);
      }
      i++;
   }
   if(_global.playSwfFileName.indexOf("FQ02") != -1)
   {
      _root[strTempLID + "FQ01"]._visible = false;
      _root[strTempLID + "FQ02"]._visible = false;
      _root[strTempLID + "FQ03"]._visible = false;
   }
   if(_global.playSwfFileName.indexOf("FQ02") == -1 && _global.playSwfFileName.indexOf("FQ03") == -1)
   {
      ss = new Sound();
      ss.setVolume(_global.volLevel);
      if(_root.InternalPreloader._currentframe == 1 && _root.animation_mc.animation._currentframe > 1 && _root.animation_mc.animation._currentframe >= _root.animation_mc.animation._totalframes)
      {
         if(_root.nextani._currentframe == 1)
         {
            _root.nextani.gotoAndPlay("nextani");
         }
      }
      else
      {
         _root.nextani.gotoAndStop(1);
      }
      _root.doCheckSpanishAudio();
      _root.BtnRewind.enabled = true;
      _root.BtnForward.enabled = true;
      if(_root.animation_mc.animation._currentframe <= 1)
      {
         _root.BtnRewind.enabled = false;
         _root.BtnForward.enabled = true;
         _global.rewind = 0;
         _root.pause_mc._visible = false;
         _root.play_mc._visible = true;
      }
      if(_root.animation_mc.animation._currentframe >= _root.animation_mc.animation._totalframes)
      {
         _root.BtnRewind.enabled = true;
         _root.BtnForward.enabled = false;
         _global.forward = 0;
         _root.pause_mc._visible = false;
         _root.play_mc._visible = true;
      }
      if(_root.animation_mc.animation._currentframe > 1 && _root.animation_mc.animation._currentframe >= _root.animation_mc.animation._totalframes)
      {
         _root.animation_mc.animation.stop();
         if(_global.randomAudio == true)
         {
            _global.gSound.setVolume(0);
         }
         _root.animation_mc.animation.s_aud1.gotoAndStop(1);
         _root.pause_mc._visible = false;
         _root.play_mc._visible = false;
         if(_global.Play == true && _global.CompClick == "")
         {
            _root.m_c._visible = false;
            _root.glossary._visible = false;
            _root.calculator._visible = false;
            _root.m1_l1.gotoAndStop("m1_l1_content");
            _root.m1_l1._visible = false;
         }
      }
      else if(_root.animation_mc.animation._currentframe >= 1 && _root.animation_mc.animation._currentframe < _root.animation_mc.animation._totalframes)
      {
         if(_global.needMoreBackURL != "")
         {
            _root.animation_mc.animation.TestBack._alpha = 100;
            _root.animation_mc.animation.TestBack._visible = true;
         }
         else
         {
            _root.animation_mc.animation.TestBack._alpha = 0;
            _root.animation_mc.animation.TestBack._visible = false;
         }
         _root.nextani.gotoAndStop(1);
         if(_global.Play == true && _global.CompClick == "" && _global.quizSection == false)
         {
            _root.mover_mc.gotoAndStop("inactive");
            _root.nextani.gotoAndStop(1);
            _root.glossary._visible = false;
            _root.m_c._visible = false;
            _root.calculator._visible = false;
            _root.m1_l1.gotoAndStop("m1_l1_content");
            _root.m1_l1._visible = false;
            _root.replay_mc.gotoAndStop("inactive");
            if(_global.playSwfFileName.indexOf("FQ") == -1)
            {
               _root.pause_mc._visible = true;
               _root.play_mc._visible = false;
            }
            if(_root.animation_mc.animation._currentframe == _global.CurPlayFrame)
            {
               _root.animation_mc.animation.play();
            }
            _root.animation_mc.animation.s_aud1.gotoAndStop(1);
            i = 1;
            while(i <= 4)
            {
               eval("_root.animation_mc.animation.Mc_Feed" + i).gotoAndStop(1);
               eval("_root.animation_mc.animation.Mc_Feed" + i)._visible = false;
               eval("_root.animation_mc.animation.Mc_Right_Feed" + i).gotoAndStop(1);
               eval("_root.animation_mc.animation.Mc_Right_Feed" + i)._visible = false;
               eval("_root.animation_mc.animation.Mc_Wrong_Feed" + i).gotoAndStop(1);
               eval("_root.animation_mc.animation.Mc_Wrong_Feed" + i)._visible = false;
               i++;
            }
            if(_global.Mute == false)
            {
               _global.gSound.setVolume(_global.volLevel);
            }
            else
            {
               _global.gSound.setVolume(0);
            }
         }
         else
         {
            if(_global.playSwfFileName.indexOf("FQ") == -1)
            {
               _root.pause_mc._visible = false;
               _root.play_mc._visible = true;
            }
            _root.animation_mc.animation.stop();
            _root.animation_mc.animation.s_aud1.gotoAndStop(1);
            _global.CurPlayFrame = _root.animation_mc.animation._currentframe;
            if(_global.randomAudio == true)
            {
               _global.gSound.setVolume(0);
            }
         }
      }
   }
   else
   {
      _root.nextani.gotoAndStop(1);
   }
   if(_global.playSwfFileName.indexOf("FQ02") != -1)
   {
      _root.pause_mc._visible = false;
      _root.play_mc._visible = false;
   }
}
function doCheckRndAudio()
{
   var _loc1_ = _global;
   var §flgExists:Boolean§;
   var §splTempChkName:Array§;
   splTempChkName = _loc1_.playSwfFileName.split("/");
   flgExists = false;
   i = 2;
   while(i < _loc1_.arrRndSec1_Details.length)
   {
      if(_loc1_.arrRndSec1_Details[i] == splTempChkName[splTempChkName.length - 1])
      {
         flgExists = true;
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrRndSec2_Details.length)
   {
      if(_loc1_.arrRndSec2_Details[i] == splTempChkName[splTempChkName.length - 1])
      {
         flgExists = true;
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrRndSec3_Details.length)
   {
      if(_loc1_.arrRndSec3_Details[i] == splTempChkName[splTempChkName.length - 1])
      {
         flgExists = true;
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrRndSec4_Details.length)
   {
      if(_loc1_.arrRndSec4_Details[i] == splTempChkName[splTempChkName.length - 1])
      {
         flgExists = true;
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrRndSec5_Details.length)
   {
      if(_loc1_.arrRndSec5_Details[i] == splTempChkName[splTempChkName.length - 1])
      {
         flgExists = true;
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrRndSec6_Details.length)
   {
      if(_loc1_.arrRndSec6_Details[i] == splTempChkName[splTempChkName.length - 1])
      {
         flgExists = true;
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrRndSec7_Details.length)
   {
      if(_loc1_.arrRndSec7_Details[i] == splTempChkName[splTempChkName.length - 1])
      {
         flgExists = true;
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrRndSec8_Details.length)
   {
      if(_loc1_.arrRndSec8_Details[i] == splTempChkName[splTempChkName.length - 1])
      {
         flgExists = true;
      }
      i++;
   }
   if(flgExists)
   {
      _loc1_.rndAud = random(2);
      _loc1_.rndAudLabel = "S" + _loc1_.rndAud;
      _root.Mc_Random_Audio.gotoAndPlay(_loc1_.rndAudLabel);
      _loc1_.gSound = new Sound();
      _loc1_.gSound.attachSound(_loc1_.rndAudLabel);
      _loc1_.gSound.start();
      _loc1_.gSound.setVolume(_loc1_.VolLevel);
      _loc1_.randomAudio = true;
   }
   else
   {
      _loc1_.randomAudio = false;
      _root.s_aud1.gotoAndStop(1);
   }
}
function doCheckBGText()
{
   var _loc1_ = _global;
   var §flgExists:Boolean§;
   var §splTempChkName:Array§;
   splTempChkName = _loc1_.playSwfFileName.split("/");
   flgExists = false;
   i = 2;
   while(i < _loc1_.arrBGTextSec1_Details.length)
   {
      if(_loc1_.arrBGTextSec1_Details[i] == splTempChkName[splTempChkName.length - 1])
      {
         flgExists = true;
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrBGTextSec2_Details.length)
   {
      if(_loc1_.arrBGTextSec2_Details[i] == splTempChkName[splTempChkName.length - 1])
      {
         flgExists = true;
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrBGTextSec3_Details.length)
   {
      if(_loc1_.arrBGTextSec3_Details[i] == splTempChkName[splTempChkName.length - 1])
      {
         flgExists = true;
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrBGTextSec4_Details.length)
   {
      if(_loc1_.arrBGTextSec4_Details[i] == splTempChkName[splTempChkName.length - 1])
      {
         flgExists = true;
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrBGTextSec5_Details.length)
   {
      if(_loc1_.arrBGTextSec5_Details[i] == splTempChkName[splTempChkName.length - 1])
      {
         flgExists = true;
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrBGTextSec6_Details.length)
   {
      if(_loc1_.arrBGTextSec6_Details[i] == splTempChkName[splTempChkName.length - 1])
      {
         flgExists = true;
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrBGTextSec7_Details.length)
   {
      if(_loc1_.arrBGTextSec7_Details[i] == splTempChkName[splTempChkName.length - 1])
      {
         flgExists = true;
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrBGTextSec8_Details.length)
   {
      if(_loc1_.arrBGTextSec8_Details[i] == splTempChkName[splTempChkName.length - 1])
      {
         flgExists = true;
      }
      i++;
   }
   if(flgExists)
   {
      _root.Mc_BackText._visible = true;
   }
   else
   {
      _root.Mc_BackText._visible = false;
   }
}
function doForAndRew()
{
   var _loc1_ = _root;
   var _loc2_ = _global;
   if(_loc1_.animation_mc.animation.start == true && _loc2_.forward == 1)
   {
      _loc1_.animation_mc.animation.val = _loc1_.animation_mc.animation._currentframe;
      _loc1_.animation_mc.animation.val += 20;
      if(_loc1_.animation_mc.animation.val >= _loc1_.animation_mc.animation._totalframes)
      {
         _loc1_.popup.gotoAndStop(1);
         _loc1_.animation_mc.animation.gotoAndStop(_loc1_.animation_mc.animation._totalframes);
      }
      else
      {
         _loc1_.animation_mc.animation.gotoAndStop(_loc1_.animation_mc.animation.val);
         if(_loc2_.quizSection == false)
         {
            _loc1_.animation_mc.animation.play();
         }
      }
   }
   else if(_loc1_.animation_mc.animation.start == true && _loc2_.rewind == 1)
   {
      _loc1_.animation_mc.animation.val = _loc1_.animation_mc.animation._currentframe;
      _loc1_.animation_mc.animation.val -= 20;
      if(_loc1_.animation_mc.animation.val <= 1)
      {
         _loc1_.animation_mc.animation.gotoAndPlay(1);
         _loc1_.popup.gotoAndStop(1);
      }
      else
      {
         _loc1_.animation_mc.animation.gotoAndStop(_loc1_.animation_mc.animation.val);
         if(_loc2_.quizSection == false)
         {
            _loc1_.animation_mc.animation.play();
         }
      }
   }
}
function doPutBackAndFinished()
{
   var _loc1_ = _global;
   var §flgExists:Boolean§;
   flgExists = false;
   var §splTempChkName:Array§;
   splTempChkName = _loc1_.playSwfFileName.substring(0,_loc1_.playSwfFileName.length - 4).split("/");
   i = 0;
   while(i < _loc1_.arrFinishSlide.length)
   {
      if(_loc1_.arrFinishSlide[i] == splTempChkName[splTempChkName.length - 1])
      {
         flgExists = true;
      }
      i++;
   }
   if(flgExists == false)
   {
      _loc1_.arrFinishSlide.push(splTempChkName[splTempChkName.length - 1]);
   }
   if(_loc1_.arrGoBack[_loc1_.arrGoBack.length - 1] != splTempChkName[splTempChkName.length - 1])
   {
      _loc1_.arrGoBack.push(splTempChkName[splTempChkName.length - 1]);
   }
}
function DoHyperLinks()
{
   var _loc1_ = _root;
   var _loc2_ = _global;
   _loc2_.CompClick = "HyperLink";
   _loc2_.Pause = true;
   _loc2_.Play = false;
   _loc1_.popup.gotoAndStop(1);
   _loc1_.mover_mc.gotoAndStop("inactive");
   _loc1_.nextani.gotoAndStop(1);
   _loc1_.navi.enabled = false;
   _loc1_.glossary._visible = false;
   _loc1_.m1_l1._visible = false;
   _loc1_.calculator._visible = false;
   _loc1_.ct_center.gotoAndStop(2);
   _loc1_.m_c.gotoAndStop(6);
   _loc1_.m_c._visible = true;
   _loc2_.KeyAttribute += "~English";
   _loc2_.openScrKey = true;
   _loc1_.m_c.doGetSubLink(_loc2_.KeyAttribute);
}
function doGetSwfFileName(mcClipName)
{
   var _loc1_ = _global;
   var _loc2_ = mcClipName;
   i = 2;
   while(i < _loc1_.arrSection1_Details.length)
   {
      if(_loc1_.arrSection1_Details[i] == _loc2_ + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 1;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/IR/" + _loc2_ + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection2_Details.length)
   {
      if(_loc1_.arrSection2_Details[i] == _loc2_ + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 2;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/RW/" + _loc2_ + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection3_Details.length)
   {
      if(_loc1_.arrSection3_Details[i] == _loc2_ + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 3;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/VB/" + _loc2_ + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection4_Details.length)
   {
      if(_loc1_.arrSection4_Details[i] == _loc2_ + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 4;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/IN/" + _loc2_ + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection5_Details.length)
   {
      if(_loc1_.arrSection5_Details[i] == _loc2_ + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 5;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/TI/" + _loc2_ + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection6_Details.length)
   {
      if(_loc1_.arrSection6_Details[i] == _loc2_ + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 6;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/GS/" + _loc2_ + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection7_Details.length)
   {
      if(_loc1_.arrSection7_Details[i] == _loc2_ + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 7;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/TS/" + _loc2_ + ".swf";
      }
      i++;
   }
   i = 2;
   while(i < _loc1_.arrSection8_Details.length)
   {
      if(_loc1_.arrSection8_Details[i] == _loc2_ + ".swf")
      {
         _loc1_.slideNumber = i;
         _loc1_.sectionNumber = 8;
         _loc1_.playSwfFileName = _loc1_.tempURL + "/FQ/" + _loc2_ + ".swf";
      }
      i++;
   }
}
function doGetSQSwfFileName(mcClipName)
{
   var _loc1_ = _global;
   var _loc2_ = mcClipName;
   if(_loc1_.sectionNumber == 1)
   {
      _loc1_.playSwfFileName = _loc1_.tempURL + "/IR/" + _loc2_ + ".swf";
      i = 2;
      while(i < _loc1_.arrSection1_Details.length)
      {
         if(_loc1_.arrSection1_Details[i] == _loc2_ + ".swf")
         {
            _loc1_.slideNumber = i;
         }
         i++;
      }
   }
   if(_loc1_.sectionNumber == 2)
   {
      _loc1_.playSwfFileName = _loc1_.tempURL + "/RW/" + _loc2_ + ".swf";
      i = 2;
      while(i < _loc1_.arrSection2_Details.length)
      {
         if(_loc1_.arrSection2_Details[i] == _loc2_ + ".swf")
         {
            _loc1_.slideNumber = i;
         }
         i++;
      }
   }
   if(_loc1_.sectionNumber == 3)
   {
      _loc1_.playSwfFileName = _loc1_.tempURL + "/VB/" + _loc2_ + ".swf";
      i = 2;
      while(i < _loc1_.arrSection3_Details.length)
      {
         if(_loc1_.arrSection3_Details[i] == _loc2_ + ".swf")
         {
            _loc1_.slideNumber = i;
         }
         i++;
      }
   }
   if(_loc1_.sectionNumber == 4)
   {
      _loc1_.playSwfFileName = _loc1_.tempURL + "/IN/" + _loc2_ + ".swf";
      i = 2;
      while(i < _loc1_.arrSection4_Details.length)
      {
         if(_loc1_.arrSection4_Details[i] == _loc2_ + ".swf")
         {
            _loc1_.slideNumber = i;
         }
         i++;
      }
   }
   if(_loc1_.sectionNumber == 5)
   {
      _loc1_.playSwfFileName = _loc1_.tempURL + "/TI/" + _loc2_ + ".swf";
      i = 2;
      while(i < _loc1_.arrSection5_Details.length)
      {
         if(_loc1_.arrSection5_Details[i] == _loc2_ + ".swf")
         {
            _loc1_.slideNumber = i;
         }
         i++;
      }
   }
   if(_loc1_.sectionNumber == 6)
   {
      _loc1_.playSwfFileName = _loc1_.tempURL + "/GS/" + _loc2_ + ".swf";
      i = 2;
      while(i < _loc1_.arrSection6_Details.length)
      {
         if(_loc1_.arrSection6_Details[i] == _loc2_ + ".swf")
         {
            _loc1_.slideNumber = i;
         }
         i++;
      }
   }
   if(_loc1_.sectionNumber == 7)
   {
      _loc1_.playSwfFileName = _loc1_.tempURL + "/TS/" + _loc2_ + ".swf";
      i = 2;
      while(i < _loc1_.arrSection7_Details.length)
      {
         if(_loc1_.arrSection7_Details[i] == _loc2_ + ".swf")
         {
            _loc1_.slideNumber = i;
         }
         i++;
      }
   }
   if(_loc1_.sectionNumber == 8)
   {
      _loc1_.playSwfFileName = _loc1_.tempURL + "/FQ/" + _loc2_ + ".swf";
      i = 2;
      while(i < _loc1_.arrSection8_Details.length)
      {
         if(_loc1_.arrSection8_Details[i] == _loc2_ + ".swf")
         {
            _loc1_.slideNumber = i;
         }
         i++;
      }
   }
}
function doPlaySpanishAudio()
{
   if(_global.sectionNumber == 2 || _global.sectionNumber == 3 || _global.sectionNumber == 4 || _global.sectionNumber == 5 || _global.sectionNumber == 6 || _global.sectionNumber == 7 && _global.slideNumber != 2)
   {
      _root.SA._visible = false;
      _root.SA_PLAY._alpha = 100;
      _root.SA_PAUSE._alpha = 100;
      _root.SA_PLAY._visible = false;
      _root.SA_PAUSE._visible = true;
      _root.EA._visible = true;
      _global.spanSound = true;
      SFTemFName = _global.playSwfFileName.split("/");
      SSTemFName = SFTemFName[SFTemFName.length - 1].split(".");
      _root.animation_mc.animation.stop();
      SndFName = _global.tempURL + "/SA/" + SSTemFName[0] + ".mp3";
      _global.gSound.loadSound(SndFName,1);
      _global.gSound.onSoundComplete = function()
      {
         var _loc1_ = _root;
         var _loc2_ = _global;
         _loc2_.gSound.stop();
         if(_loc1_.animation_mc.animation._currentframe != _loc1_.animation_mc.animation._totalframes && _loc2_.quizSection == false)
         {
            _loc1_.animation_mc.animation.play();
         }
         _loc1_.SA._visible = true;
         _loc1_.SA_PLAY._visible = false;
         _loc1_.SA_PAUSE._visible = false;
         _loc1_.EA._visible = false;
         _loc2_.spanSound = false;
      };
      i = 1;
      while(i <= 4)
      {
         eval("_root.animation_mc.animation.Mc_Feed" + i).gotoAndStop(1);
         eval("_root.animation_mc.animation.Mc_Right_Feed" + i).gotoAndStop(1);
         eval("_root.animation_mc.animation.Mc_Wrong_Feed" + i).gotoAndStop(1);
         i++;
      }
      _root.animation_mc.animation.Feed_Right.gotoAndStop(1);
      _root.animation_mc.animation.Feed_Wrong.gotoAndStop(1);
      _global.gSound.start();
   }
}
function doStopSpanishAudio()
{
   var _loc1_ = _root;
   var _loc2_ = _global;
   _loc2_.gSound.stop();
   if(_loc1_.animation_mc.animation._currentframe != _loc1_.animation_mc.animation._totalframes && _loc2_.quizSection == false)
   {
      _loc1_.animation_mc.animation.play();
   }
   _loc1_.SA._visible = true;
   _loc1_.SA_PLAY._visible = false;
   _loc1_.SA_PAUSE._visible = false;
   _loc1_.EA._visible = false;
   _loc2_.spanSound = false;
}
function doCreateGlossaryWord(M_Name)
{
   var _loc1_ = _root;
   var _loc2_ = _global;
   i = 0;
   while(i < _loc2_.arrKeyTermBank.length)
   {
      splKeyTerm = _loc2_.arrKeyTermBank[i].split("SPLDATA");
      _loc1_.glossary.keyterms.Sample[splKeyTerm[0]].removeMovieClip();
      i++;
   }
   _loc2_.arrTempKeyTerm = new Array();
   M_Name += "_";
   _loc1_.glossary.keyterms.BtnBack._visible = false;
   _loc1_.glossary.keyterms.TempTotCount = -1;
   F_X = new XML();
   _loc1_.QU = _loc2_.KeyTermVar;
   F_X.load(_loc2_.KeyTermVar);
   F_X.ignoreWhite = true;
   F_X.onLoad = function()
   {
      var _loc1_ = _root;
      var _loc2_ = _global;
      T_L = F_X.firstChild.childNodes.length;
      S_X = F_X.firstChild;
      i = 0;
      while(i < T_L)
      {
         S_L = S_X.childNodes[i].nodeName;
         splLng = S_L.split("~LNG~");
         lngEng = splLng[0];
         lngSpan = splLng[1];
         keyExample1 = splLng[2];
         if(lngEng.indexOf("~") != -1)
         {
            tempSpl = lngEng.split("~");
            newTempSpl = "";
            k = 0;
            while(k <= tempSpl.length - 1)
            {
               if(newTempSpl == "")
               {
                  newTempSpl = tempSpl[k];
               }
               else
               {
                  newTempSpl = newTempSpl + " " + tempSpl[k];
               }
               k++;
            }
            lngEng = newTempSpl;
         }
         if(lngSpan.indexOf("~") != -1)
         {
            tempSpl = lngSpan.split("~");
            newTempSpl = "";
            k = 0;
            while(k <= tempSpl.length - 1)
            {
               if(newTempSpl == "")
               {
                  newTempSpl = tempSpl[k];
               }
               else
               {
                  newTempSpl = newTempSpl + " " + tempSpl[k];
               }
               k++;
            }
            lngSpan = newTempSpl;
         }
         S_T = S_X.childNodes[i].firstChild;
         duplicateMovieClip("_root.glossary.keyterms.Source",M_Name add i,16384 + i);
         _loc2_.arrTempKeyTerm.push(M_Name add i);
         _loc1_.glossary.keyterms[M_Name add i]._Y = -40 + (_loc1_[M_Name add i]._Height + 20) * (_loc1_.glossary.keyterms.TempTotCount + 2);
         if(_loc1_.glossary.keyterms[M_Name add i]._Y <= -40 || _loc1_.glossary.keyterms[M_Name add i]._Y >= 140)
         {
            _loc1_.glossary.keyterms[M_Name add i]._visible = false;
         }
         else
         {
            _loc1_.glossary.keyterms[M_Name add i]._visible = true;
         }
         if(_loc2_.LngFlag == "English")
         {
            _loc1_.glossary.keyterms[M_Name add i].Info = lngEng;
         }
         else
         {
            _loc1_.glossary.keyterms[M_Name add i].Info = lngSpan;
         }
         _loc1_.glossary.keyterms[M_Name add i].text = S_T;
         tempKeyTermValue = M_Name add i + "SPLDATA" + lngEng + "SPLDATA" + lngSpan + "SPLDATA" + S_T + "SPLDATA" + S_X.childNodes[i].attributes.SubLinkEng + "SPLDATA" + S_X.childNodes[i].attributes.SubLinkSpan + "SPLDATA" + S_X.childNodes[i].attributes.ExFileName + "SPLDATA" + S_X.childNodes[i].attributes.ScreenKeyTerm;
         _loc2_.arrKeyTermBank[i] = tempKeyTermValue;
         _loc1_.glossary.keyterms.TempTotCount += 1;
         _loc1_.glossary.keyterms.TotCount = _loc1_.glossary.keyterms.TempTotCount;
         i++;
      }
      _loc1_.glossary.keyterms.Source._visible = false;
   };
   _loc1_.glossary.keyterms.visible();
   _loc1_.glossary.keyterms.mouse_down._x = _loc1_.glossary.keyterms.x_pos;
   _loc1_.glossary.keyterms.mouse_down._y = _loc1_.glossary.keyterms.y_pos;
   _loc1_.glossary.keyterms.DesEng.text = "";
   _loc1_.glossary.keyterms.title = "";
   _loc1_.glossary.keyterms.spanish_title = "";
   _loc1_.glossary.keyterms.DesSpan.text = "";
   _loc1_.glossary.keyterms.keyterm_diagram.unloadMovie();
}
function doCreateGlossAlph(M_Name, Word)
{
   var _loc1_ = _root;
   var _loc2_ = _global;
   i = 0;
   while(i < _loc2_.arrKeyTermBank.length)
   {
      splKeyTerm = _loc2_.arrKeyTermBank[i].split("SPLDATA");
      _loc1_.glossary.keyterms[splKeyTerm[0]].removeMovieClip();
      i++;
   }
   _loc2_.arrTempKeyTerm = new Array();
   M_Name += "_";
   BtnBack._visible = false;
   _loc1_.glossary.keyterms.TempTotCount = -1;
   F_W = Word;
   F_X = new XML();
   F_X.load(_loc2_.KeyTermVar);
   F_X.ignoreWhite = true;
   F_X.onLoad = function()
   {
      var _loc1_ = _root;
      var _loc2_ = _global;
      T_L = F_X.firstChild.childNodes.length;
      S_X = F_X.firstChild;
      i = 0;
      while(i < T_L)
      {
         _loc1_.glossary.keyterms[M_Name add i].removeMovieClip();
         if(_loc2_.LngFlag == "English")
         {
            C_N = S_X.childNodes[i].attributes.EngCategory;
         }
         else
         {
            C_N = S_X.childNodes[i].attributes.SpanCategory;
         }
         if(C_N.toLowerCase() == F_W.toLowerCase())
         {
            S_L = S_X.childNodes[i].nodeName;
            splLng = S_L.split("~LNG~");
            lngEng = splLng[0];
            lngSpan = splLng[1];
            if(lngEng.indexOf("~") != -1)
            {
               tempSpl = lngEng.split("~");
               newTempSpl = "";
               k = 0;
               while(k <= tempSpl.length - 1)
               {
                  if(newTempSpl == "")
                  {
                     newTempSpl = tempSpl[k];
                  }
                  else
                  {
                     newTempSpl = newTempSpl + " " + tempSpl[k];
                  }
                  k++;
               }
               lngEng = newTempSpl;
            }
            if(lngSpan.indexOf("~") != -1)
            {
               tempSpl = lngSpan.split("~");
               newTempSpl = "";
               k = 0;
               while(k <= tempSpl.length - 1)
               {
                  if(newTempSpl == "")
                  {
                     newTempSpl = tempSpl[k];
                  }
                  else
                  {
                     newTempSpl = newTempSpl + " " + tempSpl[k];
                  }
                  k++;
               }
               lngSpan = newTempSpl;
            }
            S_T = S_X.childNodes[i].firstChild;
            duplicateMovieClip("_root.glossary.keyterms.Source",M_Name add i,16384 + i);
            _loc2_.arrTempKeyTerm.push(M_Name add i);
            _loc1_.glossary.keyterms[M_Name add i]._Y = -40 + (_loc1_[M_Name add i]._Height + 20) * (_loc1_.glossary.keyterms.TempTotCount + 2);
            if(_loc1_.glossary.keyterms[M_Name add i]._Y <= -40 || _loc1_.glossary.keyterms[M_Name add i]._Y >= 140)
            {
               _loc1_.glossary.keyterms[M_Name add i]._visible = false;
            }
            else
            {
               _loc1_.glossary.keyterms[M_Name add i]._visible = true;
            }
            _loc1_.glossary.keyterms[M_Name add i].Info = lngEng;
            if(_loc2_.LngFlag == "English")
            {
               _loc1_.glossary.keyterms[M_Name add i].Info = lngEng;
            }
            else
            {
               _loc1_.glossary.keyterms[M_Name add i].Info = lngSpan;
            }
            _loc1_.glossary.keyterms[M_Name add i].text = S_T;
            _loc1_.glossary.keyterms.TempTotCount += 1;
            _loc1_.glossary.keyterms.TotCount = _loc1_.glossary.keyterms.TempTotCount;
         }
         i++;
      }
      _loc1_.glossary.keyterms.Source._visible = false;
   };
   _loc1_.glossary.keyterms.keyterm_diagram.unloadMovie();
}
function doCreateSubLink(subLinkWord)
{
   var _loc1_ = _root;
   var _loc2_ = subLinkWord;
   var _loc3_ = _global;
   _loc3_.arrTempKeyTerm = new Array();
   _loc1_.glossary.keyterms.BtnBack._visible = true;
   splSubLinkWord = _loc2_.split("~");
   tempInt = -1;
   chkSubInt = 0;
   i = 0;
   while(i < _loc3_.arrKeyTermBank.length)
   {
      splKeyTerm = _loc3_.arrKeyTermBank[i].split("SPLDATA");
      if(splSubLinkWord[1] == "English")
      {
         tempLangChkWord = splKeyTerm[1];
      }
      else
      {
         tempLangChkWord = splKeyTerm[2];
      }
      if(splKeyTerm[1].toLowerCase() == splSubLinkWord[0].toLowerCase())
      {
         tempLangChkWord = splKeyTerm[1];
      }
      else if(splKeyTerm[2].toLowerCase() == splSubLinkWord[0].toLowerCase())
      {
         tempLangChkWord = splKeyTerm[2];
      }
      tempSubLinkWord = splSubLinkWord[0];
      if(tempSubLinkWord.indexOf("_") == -1)
      {
         _loc2_ = splSubLinkWord[0];
         if(tempLangChkWord.toLowerCase() == _loc2_.toLowerCase())
         {
            chkSubInt++;
            if(chkSubInt == 1)
            {
               tempInt = i;
            }
         }
      }
      else
      {
         tempSplSubLinkWord = tempSubLinkWord.split("_");
         _loc2_ = tempSplSubLinkWord[0];
         if(tempLangChkWord.toLowerCase() == _loc2_.toLowerCase())
         {
            chkSubInt++;
            if(Number(tempSplSubLinkWord[1]) == chkSubInt)
            {
               tempInt = i;
            }
         }
      }
      _loc1_.glossary.keyterms[splKeyTerm[0]].removeMovieClip();
      i++;
   }
   _loc1_.glossary.keyterms.TempTotCount = -1;
   splKeyTerm = _loc3_.arrKeyTermBank[tempInt].split("SPLDATA");
   duplicateMovieClip("_root.glossary.keyterms.Source",splKeyTerm[0],16384 + tempInt);
   _loc3_.arrTempKeyTerm.push(splKeyTerm[0]);
   colorMc = _loc1_.glossary.keyterms[splKeyTerm[0]];
   theColor = new Color(colorMc);
   theColor.setRGB(26112);
   _loc1_.glossary.keyterms[splKeyTerm[0]]._Y = -40 + (_loc1_[splKeyTerm[0]]._Height + 20);
   if(_loc1_.glossary.keyterms[splKeyTerm[0]]._Y <= -45 || _loc1_.glossary.keyterms[splKeyTerm[0]]._Y >= 155)
   {
      _loc1_.glossary.keyterms[splKeyTerm[0]]._visible = false;
   }
   else
   {
      _loc1_.glossary.keyterms[splKeyTerm[0]]._visible = true;
   }
   if(_loc3_.LngFlag == "English")
   {
      _loc1_.glossary.keyterms[splKeyTerm[0]].Info = splKeyTerm[1];
   }
   else
   {
      _loc1_.glossary.keyterms[splKeyTerm[0]].Info = splKeyTerm[2];
   }
   _loc1_.glossary.keyterms[splKeyTerm[0]].text = splKeyTerm[3];
   _loc1_.glossary.keyterms.TempTotCount = TempTotCount + 1;
   _loc1_.glossary.keyterms.TotCount = TempTotCount;
   _loc1_.glossary.keyterms.title = splKeyTerm[1];
   _loc1_.glossary.keyterms.spanish_title = splKeyTerm[2];
   splKeyTermDesc = splKeyTerm[3].split("~LNG~");
   tempDescription = splKeyTermDesc[0];
   tempSubLink = splKeyTerm[4];
   if(tempSubLink != "" && tempSubLink != undefined && tempSubLink != "undefined")
   {
      splTempSubLink = new Array();
      splTempSubLink = tempSubLink.split("~");
      i = 0;
      while(i < splTempSubLink.length)
      {
         splTempLinkWord = splTempSubLink[i].split(",");
         splTempDesc = tempDescription.split(splTempLinkWord[0]);
         tempLinkVal = "";
         j = 0;
         while(j < splTempDesc.length)
         {
            if(j == 0)
            {
               if(splTempDesc[j] == "")
               {
                  tempLinkVal = "<A HREF=\'asfunction:doGetSubLink," + splTempLinkWord[1] + "~English\'><FONT COLOR=\'#006600\'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>";
               }
               else
               {
                  tempLinkVal = splTempDesc[j];
               }
            }
            else if(j == 1)
            {
               if(splTempDesc[j - 1] == "")
               {
                  tempLinkVal += splTempDesc[j];
               }
               else
               {
                  tempLinkVal = tempLinkVal + "<A HREF=\'asfunction:doGetSubLink," + splTempLinkWord[1] + "~English\'><FONT COLOR=\'#006600\'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>" + splTempDesc[j];
               }
            }
            else
            {
               tempLinkVal = tempLinkVal + splTempLinkWord[0] + splTempDesc[j];
            }
            j++;
         }
         tempDescription = tempLinkVal;
         i++;
      }
      splTempSpace = tempDescription.split("</A> <A");
      tempFinalKTDef = "";
      i = 0;
      while(i < splTempSpace.length)
      {
         if(tempFinalKTDef == "")
         {
            tempFinalKTDef = splTempSpace[i];
         }
         else
         {
            tempFinalKTDef = tempFinalKTDef + "</A>&nbsp;<A" + splTempSpace[i];
         }
         i++;
      }
      _loc1_.glossary.keyterms.DesEng.htmlText = tempFinalKTDef;
   }
   else
   {
      _loc1_.glossary.keyterms.DesEng.htmlText = tempDescription;
   }
   tempDescription = splKeyTermDesc[1];
   tempSubLink = splKeyTerm[5];
   if(tempSubLink != "" && tempSubLink != undefined && tempSubLink != "undefined")
   {
      splTempSubLink = new Array();
      splTempSubLink = tempSubLink.split("~");
      i = 0;
      while(i < splTempSubLink.length)
      {
         splTempLinkWord = splTempSubLink[i].split(",");
         splTempDesc = tempDescription.split(splTempLinkWord[0]);
         tempLinkVal = "";
         j = 0;
         while(j < splTempDesc.length)
         {
            if(j == 0)
            {
               if(splTempDesc[j] == "")
               {
                  tempLinkVal = "<A HREF=\'asfunction:doGetSubLink," + splTempLinkWord[1] + "~Spanish\'><FONT COLOR=\'#006600\'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>";
               }
               else
               {
                  tempLinkVal = splTempDesc[j];
               }
            }
            else if(j == 1)
            {
               if(splTempDesc[j - 1] == "")
               {
                  tempLinkVal += splTempDesc[j];
               }
               else
               {
                  tempLinkVal = tempLinkVal + "<A HREF=\'asfunction:doGetSubLink," + splTempLinkWord[1] + "~Spanish\'><FONT COLOR=\'#006600\'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>" + splTempDesc[j];
               }
            }
            else
            {
               tempLinkVal = tempLinkVal + splTempLinkWord[0] + splTempDesc[j];
            }
            j++;
         }
         tempDescription = tempLinkVal;
         i++;
      }
      splTempSpace = tempDescription.split("</A> <A");
      tempFinalKTDef = "";
      i = 0;
      while(i < splTempSpace.length)
      {
         if(tempFinalKTDef == "")
         {
            tempFinalKTDef = splTempSpace[i];
         }
         else
         {
            tempFinalKTDef = tempFinalKTDef + "</A>&nbsp;<A" + splTempSpace[i];
         }
         i++;
      }
      _loc1_.glossary.keyterms.DesSpan.htmlText = tempFinalKTDef;
   }
   else
   {
      _loc1_.glossary.keyterms.DesSpan.htmlText = tempDescription;
   }
   if(_loc1_.glossary.keyterms.title.toLowerCase() == "angle")
   {
      tempDesc = _loc1_.glossary.keyterms.DesEng.htmlText.substring(0,_loc1_.glossary.keyterms.DesEng.htmlText.length - 2) + "&nbsp;<I>L</I>";
      _loc1_.glossary.keyterms.DesEng.htmlText.htmlText = tempDesc;
      tempDesc = _loc1_.glossary.keyterms.DesSpan.htmlText.substring(0,_loc1_.glossary.keyterms.DesSpan.htmlText.length - 2) + "&nbsp;<I>L</I>";
      _loc1_.glossary.keyterms.DesSpan.htmlText.htmlText = tempDesc;
   }
   exampleSwfFileName = _loc3_.xmlPath + "DIG/" + splKeyTerm[6].toLowerCase();
   _loc1_.glossary.keyterms.keyterm_diagram.unloadMovie();
   _loc1_.glossary.keyterms.keyterm_diagram.loadMovie(exampleSwfFileName,7);
}
function doInitKeyTerms()
{
   var _loc1_ = _root;
   var _loc2_ = _global;
   _loc1_.glossary.keyterms.BtnBack._visible = false;
   _loc2_.scrollUp;
   _loc2_.scrollDown;
   _loc2_.KeyTermVar = _loc2_.xmlPath + "XML/ELKTEG4.xml";
   _loc1_.glossary.keyterms.DesEng.html = true;
   _loc1_.glossary.keyterms.DesSpan.html = true;
   _loc1_.glossary.keyterms.Display = "";
   _loc1_.glossary.keyterms.title = "";
   _loc1_.glossary.keyterms.spanish_title = "";
   _loc1_.glossary.keyterms.C_L("Source");
   _loc1_.glossary.keyterms.stop();
}
function doVisibleKeyAlphBut()
{
   var _loc1_ = _root;
   _loc1_.glossary.keyterms.a._visible = true;
   _loc1_.glossary.keyterms.b._visible = true;
   _loc1_.glossary.keyterms.c._visible = true;
   _loc1_.glossary.keyterms.d._visible = true;
   _loc1_.glossary.keyterms.e._visible = true;
   _loc1_.glossary.keyterms.f._visible = true;
   _loc1_.glossary.keyterms.g._visible = true;
   _loc1_.glossary.keyterms.h._visible = true;
   _loc1_.glossary.keyterms.useri._visible = true;
   _loc1_.glossary.keyterms.j._visible = true;
   _loc1_.glossary.keyterms.userk._visible = true;
   _loc1_.glossary.keyterms.l._visible = true;
   _loc1_.glossary.keyterms.m._visible = true;
   _loc1_.glossary.keyterms.n._visible = true;
   _loc1_.glossary.keyterms.o._visible = true;
   _loc1_.glossary.keyterms.p._visible = true;
   _loc1_.glossary.keyterms.q._visible = true;
   _loc1_.glossary.keyterms.r._visible = true;
   _loc1_.glossary.keyterms.s._visible = true;
   _loc1_.glossary.keyterms.t._visible = true;
   _loc1_.glossary.keyterms.u._visible = true;
   _loc1_.glossary.keyterms.v._visible = true;
   _loc1_.glossary.keyterms.w._visible = true;
   _loc1_.glossary.keyterms.x._visible = true;
   _loc1_.glossary.keyterms.y._visible = true;
   _loc1_.glossary.keyterms.z._visible = true;
}
function doKeyTermsScrollUpDown()
{
   var _loc1_ = _root;
   var _loc3_ = _global;
   var _loc2_;
   if(_loc3_.scrollUp == false && _loc3_.scrollDown == true)
   {
      var EndMovName;
      if(_loc1_.glossary.keyterms.TotCount >= 9)
      {
         EndMovName = _loc1_.glossary.keyterms[_loc3_.arrTempKeyTerm[_loc1_.glossary.keyterms.TotCount]];
         if(EndMovName._Y >= 140)
         {
            i = 0;
            while(i <= _loc1_.glossary.keyterms.TotCount)
            {
               _loc2_ = _loc1_.glossary.keyterms[_loc3_.arrTempKeyTerm[i]];
               _loc2_._Y -= 20;
               if(_loc2_._Y <= -40 || _loc2_._Y >= 140)
               {
                  _loc2_._visible = false;
               }
               else
               {
                  _loc2_._visible = true;
               }
               i++;
            }
         }
      }
   }
   if(_loc3_.scrollUp == true && _loc3_.scrollDown == false)
   {
      if(_loc1_.glossary.keyterms.TotCount >= 9)
      {
         if(_loc1_.glossary.keyterms[_loc3_.arrTempKeyTerm[0]]._Y <= -40)
         {
            i = 0;
            while(i <= _loc1_.glossary.keyterms.TotCount)
            {
               _loc2_ = _loc1_.glossary.keyterms[_loc3_.arrTempKeyTerm[i]];
               _loc2_._Y += 20;
               if(_loc2_._Y <= -40 || _loc2_._Y >= 140)
               {
                  _loc2_._visible = false;
               }
               else
               {
                  _loc2_._visible = true;
               }
               i++;
            }
         }
      }
   }
   if(_loc3_.scrollDraggerUp == false && _loc3_.scrollDraggerDown == true)
   {
      var EndMovName;
      if(_loc1_.glossary.keyterms.TotCount >= 9)
      {
         EndMovName = _loc1_.glossary.keyterms[_loc3_.arrTempKeyTerm[_loc1_.glossary.keyterms.TotCount]];
         if(EndMovName._Y >= 140)
         {
            i = 0;
            while(i <= _loc1_.glossary.keyterms.TotCount)
            {
               _loc2_ = _loc1_.glossary.keyterms[_loc3_.arrTempKeyTerm[i]];
               tempChkInt = _loc1_.glossary.keyterms.Scroll_Dragger._y + 12;
               tempChkInt = tempChkInt;
               _loc2_._Y -= tempChkInt;
               if(_loc2_._Y <= -40 || _loc2_._Y >= 140)
               {
                  _loc2_._visible = false;
               }
               else
               {
                  _loc2_._visible = true;
               }
               i++;
            }
         }
      }
   }
   if(_loc3_.scrollDraggerUp == true && _loc3_.scrollDraggerDown == false)
   {
      if(_loc1_.glossary.keyterms.TotCount >= 9)
      {
         if(_loc1_.glossary.keyterms[_loc3_.arrTempKeyTerm[0]]._Y <= -40)
         {
            i = 0;
            while(i <= _loc1_.glossary.keyterms.TotCount)
            {
               _loc2_ = _loc1_.glossary.keyterms[_loc3_.arrTempKeyTerm[i]];
               _loc2_._Y += 100;
               if(_loc2_._Y <= -40 || _loc2_._Y >= 140)
               {
                  _loc2_._visible = false;
               }
               else
               {
                  _loc2_._visible = true;
               }
               i++;
            }
         }
      }
   }
}
function doDisplayGlossDescription(tempMcName)
{
   var _loc1_ = _root;
   var _loc2_ = _global;
   var _loc3_ = tempMcName;
   _loc1_.glossary.keyterms.BtnBack._visible = false;
   splTemp = _loc3_.split("_");
   colorMc = _loc1_.glossary.keyterms[_loc2_.mcChangeColor];
   theColor = new Color(colorMc);
   theColor.setRGB(6710886);
   _loc2_.mcChangeColor = _loc3_;
   colorMc = _loc1_.glossary.keyterms[_loc3_];
   theColor = new Color(colorMc);
   theColor.setRGB(26112);
   tempKeyTerm = _loc2_.arrKeyTermBank[parseFloat(splTemp[1])];
   splKeyTerm = tempKeyTerm.split("SPLDATA");
   _loc1_.glossary.keyterms.title = splKeyTerm[1];
   _loc1_.glossary.keyterms.spanish_title = splKeyTerm[2];
   splKeyTermDesc = splKeyTerm[3].split("~LNG~");
   tempDescription = splKeyTermDesc[0];
   tempSubLink = splKeyTerm[4];
   if(tempSubLink != "" && tempSubLink != undefined && tempSubLink != "undefined")
   {
      splTempSubLink = new Array();
      splTempSubLink = tempSubLink.split("~");
      i = 0;
      while(i < splTempSubLink.length)
      {
         splTempLinkWord = splTempSubLink[i].split(",");
         splTempDesc = tempDescription.split(splTempLinkWord[0]);
         tempLinkVal = "";
         j = 0;
         while(j < splTempDesc.length)
         {
            if(j == 0)
            {
               if(splTempDesc[j] == "")
               {
                  tempLinkVal = "<A HREF=\'asfunction:doGetSubLink," + splTempLinkWord[1] + "~English\'><FONT COLOR=\'#006600\'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>";
               }
               else
               {
                  tempLinkVal = splTempDesc[j];
               }
            }
            else if(j == 1)
            {
               if(splTempDesc[j - 1] == "")
               {
                  tempLinkVal += splTempDesc[j];
               }
               else
               {
                  tempLinkVal = tempLinkVal + "<A HREF=\'asfunction:doGetSubLink," + splTempLinkWord[1] + "~English\'><FONT COLOR=\'#006600\'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>" + splTempDesc[j];
               }
            }
            else
            {
               tempLinkVal = tempLinkVal + splTempLinkWord[0] + splTempDesc[j];
            }
            j++;
         }
         tempDescription = tempLinkVal;
         i++;
      }
      splTempSpace = tempDescription.split("</A> <A");
      tempFinalKTDef = "";
      i = 0;
      while(i < splTempSpace.length)
      {
         if(tempFinalKTDef == "")
         {
            tempFinalKTDef = splTempSpace[i];
         }
         else
         {
            tempFinalKTDef = tempFinalKTDef + "</A>&nbsp;<A" + splTempSpace[i];
         }
         i++;
      }
      _loc1_.glossary.keyterms.DesEng.htmlText = tempFinalKTDef;
   }
   else
   {
      _loc1_.glossary.keyterms.DesEng.htmlText = tempDescription;
   }
   tempDescription = splKeyTermDesc[1];
   tempSubLink = splKeyTerm[5];
   if(tempSubLink != "" && tempSubLink != undefined && tempSubLink != "undefined")
   {
      splTempSubLink = new Array();
      splTempSubLink = tempSubLink.split("~");
      i = 0;
      while(i < splTempSubLink.length)
      {
         splTempLinkWord = splTempSubLink[i].split(",");
         splTempDesc = tempDescription.split(splTempLinkWord[0]);
         tempLinkVal = "";
         j = 0;
         while(j < splTempDesc.length)
         {
            if(j == 0)
            {
               if(splTempDesc[j] == "")
               {
                  tempLinkVal = "<A HREF=\'asfunction:doGetSubLink," + splTempLinkWord[1] + "~Spanish\'><FONT COLOR=\'#006600\'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>";
               }
               else
               {
                  tempLinkVal = splTempDesc[j];
               }
            }
            else if(j == 1)
            {
               if(splTempDesc[j - 1] == "")
               {
                  tempLinkVal += splTempDesc[j];
               }
               else
               {
                  tempLinkVal = tempLinkVal + "<A HREF=\'asfunction:doGetSubLink," + splTempLinkWord[1] + "~Spanish\'><FONT COLOR=\'#006600\'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>" + splTempDesc[j];
               }
            }
            else
            {
               tempLinkVal = tempLinkVal + splTempLinkWord[0] + splTempDesc[j];
            }
            j++;
         }
         tempDescription = tempLinkVal;
         i++;
      }
      splTempSpace = tempDescription.split("</A> <A");
      tempFinalKTDef = "";
      i = 0;
      while(i < splTempSpace.length)
      {
         if(tempFinalKTDef == "")
         {
            tempFinalKTDef = splTempSpace[i];
         }
         else
         {
            tempFinalKTDef = tempFinalKTDef + "</A>&nbsp;<A" + splTempSpace[i];
         }
         i++;
      }
      _loc1_.glossary.keyterms.DesSpan.htmlText = tempFinalKTDef;
   }
   else
   {
      _loc1_.glossary.keyterms.DesSpan.htmlText = tempDescription;
   }
   if(_loc1_.glossary.keyterms.title.toLowerCase() == "angle")
   {
      tempDesc = _loc1_.glossary.keyterms.DesEng.htmlText.substring(0,_loc1_.glossary.keyterms.DesEng.htmlText.length - 2) + "&nbsp;<I>L</I>";
      _loc1_.glossary.keyterms.DesEng.htmlText.htmlText = tempDesc;
      tempDesc = _loc1_.glossary.keyterms.DesSpan.htmlText.substring(0,_loc1_.glossary.keyterms.DesSpan.htmlText.length - 2) + "&nbsp;<I>L</I>";
      _loc1_.glossary.keyterms.DesSpan.htmlText.htmlText = tempDesc;
   }
   exampleSwfFileName = _loc2_.xmlPath + "DIG/" + splKeyTerm[6].toLowerCase();
   _loc1_.glossary.keyterms.keyterm_diagram.unloadMovie();
   _loc1_.glossary.keyterms.keyterm_diagram.loadMovie(exampleSwfFileName,7);
   if(_loc2_.LngFlag == "English")
   {
      _loc2_.backLinkWord = splKeyTerm[1] + "~English";
   }
   else
   {
      _loc2_.backLinkWord = splKeyTerm[2] + "~Spanish";
   }
}
function doCreateButAction(tempCat)
{
   var _loc1_ = _root;
   var _loc2_ = tempCat;
   _loc1_.glossary.keyterms.C_S("Source",_loc2_);
   if(_loc2_ == "i")
   {
      _loc2_ = "useri";
   }
   if(_loc2_ == "k")
   {
      _loc2_ = "userk";
   }
   _loc1_.glossary.keyterms.visible();
   _loc1_.glossary.keyterms[_loc2_]._visible = false;
   _loc1_.glossary.keyterms.mouse_down._x = _loc1_.glossary.keyterms[_loc2_]._x;
   _loc1_.glossary.keyterms.mouse_down._y = _loc1_.glossary.keyterms[_loc2_]._y;
   _loc1_.glossary.keyterms.DesEng.text = "";
   _loc1_.glossary.keyterms.title = "";
   _loc1_.glossary.keyterms.spanish_title = "";
   _loc1_.glossary.keyterms.DesSpan.text = "";
}
function doKeyTermsReset()
{
   var _loc1_ = _root;
   _loc1_.glossary.keyterms.C_L("Source");
   _loc1_.glossary.keyterms.visible();
   _loc1_.glossary.keyterms.mouse_down._x = _loc1_.glossary.keyterms.x_pos;
   _loc1_.glossary.keyterms.mouse_down._y = _loc1_.glossary.keyterms.y_pos;
   _loc1_.glossary.keyterms.DesEng.text = "";
   _loc1_.glossary.keyterms.title = "";
   _loc1_.glossary.keyterms.spanish_title = "";
   _loc1_.glossary.keyterms.DesSpan.text = "";
}
function doSwitchSpanGloss()
{
   var _loc1_ = _root;
   var _loc2_ = _global;
   _loc2_.KeyTermVar = _loc2_.xmlPath + "XML/ELKTSG4.xml";
   _loc2_.LngFlag = "Spanish";
   _loc1_.glossary.keyterms.C_L("Source");
   _loc1_.glossary.keyterms.visible();
   _loc1_.glossary.keyterms.mouse_down._x = _loc1_.glossary.keyterms.x_pos;
   _loc1_.glossary.keyterms.mouse_down._y = _loc1_.glossary.keyterms.y_pos;
   _loc1_.glossary.keyterms.DesEng.text = "";
   _loc1_.glossary.keyterms.title = "";
   _loc1_.glossary.keyterms.spanish_title = "";
   _loc1_.glossary.keyterms.DesSpan.text = "";
   _loc1_.glossary.keyterms.BtnSpan._visible = false;
   _loc1_.glossary.keyterms.BtnEng._visible = true;
   _loc1_.mover_mc.gotoAndStop("inactive");
}
function doSwitchEngGloss()
{
   var _loc1_ = _root;
   var _loc2_ = _global;
   _loc2_.KeyTermVar = _loc2_.xmlPath + "XML/ELKTEG4.xml";
   _loc2_.LngFlag = "English";
   _loc1_.glossary.keyterms.C_L("Source");
   _loc1_.glossary.keyterms.visible();
   _loc1_.glossary.keyterms.mouse_down._x = _loc1_.glossary.keyterms.x_pos;
   _loc1_.glossary.keyterms.mouse_down._y = _loc1_.glossary.keyterms.y_pos;
   _loc1_.glossary.keyterms.DesEng.text = "";
   _loc1_.glossary.keyterms.title = "";
   _loc1_.glossary.keyterms.spanish_title = "";
   _loc1_.glossary.keyterms.DesSpan.text = "";
   _loc1_.glossary.keyterms.BtnEng._visible = false;
   _loc1_.glossary.keyterms.BtnSpan._visible = true;
   _loc1_.mover_mc.gotoAndStop("inactive");
}
function doInitSKT()
{
   var _loc1_ = _root;
   _loc1_.m_c.stop();
   _loc1_.m_c.keyterm_diagram.unloadMovie();
   _loc1_.m_c.BtnBack._visible = false;
   _loc1_.Activ();
}
function doCreateSKTSubLink(subLinkWord)
{
   var _loc1_ = _root;
   var _loc2_ = subLinkWord;
   var _loc3_ = _global;
   if(_loc3_.openScrKey)
   {
      _loc1_.m_c.BtnBack._visible = false;
      _loc3_.openScrKey = false;
   }
   else
   {
      _loc1_.m_c.BtnBack._visible = true;
   }
   _loc1_.m_c.english = "";
   _loc1_.m_c.spanish = "";
   _loc1_.m_c.title_english = "";
   _loc1_.m_c.Keycontent_english.htmlText = "";
   _loc1_.m_c.title_spanish = "";
   _loc1_.m_c.Keycontent_spanish.htmlText = "";
   _loc1_.m_c.english = "English";
   _loc1_.m_c.spanish = "Spanish";
   _loc1_.m_c.Keycontent_english.html = true;
   _loc1_.m_c.Keycontent_english.multiline = true;
   _loc1_.m_c.Keycontent_english.wordWrap = true;
   _loc1_.m_c.Keycontent_spanish.html = true;
   _loc1_.m_c.Keycontent_spanish.multiline = true;
   _loc1_.m_c.Keycontent_spanish.wordWrap = true;
   splSubLinkWord = _loc2_.split("~");
   tempInt = "";
   chkSubInt = 0;
   i = 0;
   while(i < _loc3_.arrKeyTermBank.length)
   {
      splKeyTerm = _loc3_.arrKeyTermBank[i].split("SPLDATA");
      if(splSubLinkWord[1] == "English")
      {
         tempLangChkWord = splKeyTerm[1];
      }
      else
      {
         tempLangChkWord = splKeyTerm[2];
      }
      if(splKeyTerm[1].toLowerCase() == splSubLinkWord[0].toLowerCase())
      {
         tempLangChkWord = splKeyTerm[1];
      }
      else if(splKeyTerm[2].toLowerCase() == splSubLinkWord[0].toLowerCase())
      {
         tempLangChkWord = splKeyTerm[2];
      }
      tempSubLinkWord = splSubLinkWord[0];
      if(tempSubLinkWord.indexOf("_") == -1)
      {
         _loc2_ = splSubLinkWord[0];
         if(tempLangChkWord.toLowerCase() == _loc2_.toLowerCase())
         {
            chkSubInt++;
            if(chkSubInt == 1)
            {
               tempInt = i;
            }
         }
      }
      else
      {
         tempSplSubLinkWord = tempSubLinkWord.split("_");
         _loc2_ = tempSplSubLinkWord[0];
         if(tempLangChkWord.toLowerCase() == _loc2_.toLowerCase())
         {
            chkSubInt++;
            if(Number(tempSplSubLinkWord[1]) == chkSubInt)
            {
               tempInt = i;
            }
         }
      }
      i++;
   }
   splKeyTerm = _loc3_.arrKeyTermBank[tempInt].split("SPLDATA");
   _loc1_.m_c.title_english = splKeyTerm[1];
   _loc1_.m_c.title_spanish = splKeyTerm[2];
   splKeyTermDesc = splKeyTerm[3].split("~LNG~");
   tempDescription = splKeyTermDesc[0];
   tempSubLink = splKeyTerm[4];
   if(tempSubLink != "" && tempSubLink != undefined && tempSubLink != "undefined")
   {
      splTempSubLink = new Array();
      splTempSubLink = tempSubLink.split("~");
      i = 0;
      while(i < splTempSubLink.length)
      {
         splTempLinkWord = splTempSubLink[i].split(",");
         splTempDesc = tempDescription.split(splTempLinkWord[0]);
         tempLinkVal = "";
         j = 0;
         while(j < splTempDesc.length)
         {
            if(j == 0)
            {
               if(splTempDesc[j] == "")
               {
                  tempLinkVal = "<A HREF=\'asfunction:doGetSubLink," + splTempLinkWord[1] + "~English\'><FONT COLOR=\'#006600\'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>";
               }
               else
               {
                  tempLinkVal = splTempDesc[j];
               }
            }
            else if(j == 1)
            {
               if(splTempDesc[j - 1] == "")
               {
                  tempLinkVal += splTempDesc[j];
               }
               else
               {
                  tempLinkVal = tempLinkVal + "<A HREF=\'asfunction:doGetSubLink," + splTempLinkWord[1] + "~English\'><FONT COLOR=\'#006600\'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>" + splTempDesc[j];
               }
            }
            else
            {
               tempLinkVal = tempLinkVal + splTempLinkWord[0] + splTempDesc[j];
            }
            j++;
         }
         tempDescription = tempLinkVal;
         i++;
      }
      splTempSpace = tempDescription.split("</A> <A");
      tempFinalKTDef = "";
      i = 0;
      while(i < splTempSpace.length)
      {
         if(tempFinalKTDef == "")
         {
            tempFinalKTDef = splTempSpace[i];
         }
         else
         {
            tempFinalKTDef = tempFinalKTDef + "</A>&nbsp;<A" + splTempSpace[i];
         }
         i++;
      }
      _loc1_.m_c.Keycontent_english.htmlText = tempFinalKTDef;
   }
   else
   {
      _loc1_.m_c.Keycontent_english.htmlText = tempDescription;
   }
   tempDescription = splKeyTermDesc[1];
   tempSubLink = splKeyTerm[5];
   if(tempSubLink != "" && tempSubLink != undefined && tempSubLink != "undefined")
   {
      splTempSubLink = new Array();
      splTempSubLink = tempSubLink.split("~");
      i = 0;
      while(i < splTempSubLink.length)
      {
         splTempLinkWord = splTempSubLink[i].split(",");
         splTempDesc = tempDescription.split(splTempLinkWord[0]);
         tempLinkVal = "";
         j = 0;
         while(j < splTempDesc.length)
         {
            if(j == 0)
            {
               if(splTempDesc[j] == "")
               {
                  tempLinkVal = "<A HREF=\'asfunction:doGetSubLink," + splTempLinkWord[1] + "~Spanish\'><FONT COLOR=\'#006600\'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>";
               }
               else
               {
                  tempLinkVal = splTempDesc[j];
               }
            }
            else if(j == 1)
            {
               if(splTempDesc[j - 1] == "")
               {
                  tempLinkVal += splTempDesc[j];
               }
               else
               {
                  tempLinkVal = tempLinkVal + "<A HREF=\'asfunction:doGetSubLink," + splTempLinkWord[1] + "~Spanish\'><FONT COLOR=\'#006600\'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>" + splTempDesc[j];
               }
            }
            else
            {
               tempLinkVal = tempLinkVal + splTempLinkWord[0] + splTempDesc[j];
            }
            j++;
         }
         tempDescription = tempLinkVal;
         i++;
      }
      splTempSpace = tempDescription.split("</A> <A");
      tempFinalKTDef = "";
      i = 0;
      while(i < splTempSpace.length)
      {
         if(tempFinalKTDef == "")
         {
            tempFinalKTDef = splTempSpace[i];
         }
         else
         {
            tempFinalKTDef = tempFinalKTDef + "</A>&nbsp;<A" + splTempSpace[i];
         }
         i++;
      }
      _loc1_.m_c.Keycontent_spanish.htmlText = tempFinalKTDef;
   }
   else
   {
      _loc1_.m_c.Keycontent_spanish.htmlText = tempDescription;
   }
   if(_loc1_.m_c.title_english.toLowerCase() == "angle")
   {
      tempDesc = _loc1_.m_c.Keycontent_english.htmlText.substring(0,_loc1_.m_c.Keycontent_english.htmlText.length - 2) + "&nbsp;<I>L</I>";
      _loc1_.m_c.Keycontent_english.htmlText = tempDesc;
      tempDesc = _loc1_.m_c.Keycontent_spanish.htmlText.substring(0,_loc1_.m_c.Keycontent_spanish.htmlText.length - 2) + "&nbsp;<I>L</I>";
      _loc1_.m_c.Keycontent_spanish.htmlText = tempDesc;
   }
   exampleSwfFileName = _loc3_.xmlPath + "DIG/" + splKeyTerm[6].toLowerCase();
   _loc1_.m_c.keyterm_diagram.unloadMovie();
   _loc1_.m_c.keyterm_diagram.loadMovie(exampleSwfFileName,6);
}
function doSKTClose()
{
   var _loc1_ = _global;
   _loc1_.Play = true;
   _loc1_.Pause = false;
   _loc1_.CompClick = "";
   _root.m_c._visible = false;
}
LessonDetails = "[CourseDetails]~CourseName,Counting on Numbers~LessonName,Counting on Numbers~TotalSection,8[Details_Split][Section1Details]~IR~L13RW01.swf[Details_Split][Section2Details]~RW~L13RW02.swf~L13RW03.swf~L13RW04.swf[Details_Split][Section3Details]~VB~L13VB01.swf~L13VB02.swf~L13VB03.swf~L13VB04.swf~L13VB05.swf~L13VB06.swf~L13VB07.swf~L13VB08.swf~L13VB09.swf~L13VB10.swf~L13VB11.swf~L13VB12.swf~L13VB13.swf~L13VB14.swf~L13VB15.swf~L13VB16.swf~L13VB17.swf~L13VB18.swf~L13VB19.swf~L13VB20.swf[Details_Split][Section4Details]~IN~L13IN01.swf~L13IN02.swf~L13IN03.swf~L13IN04.swf~L13IN05.swf~L13IN06.swf~L13IN07.swf~L13IN08.swf~L13IN09.swf~L13IN10.swf~L13IN11.swf~L13IN12.swf~L13IN13.swf~L13IN14a.swf~L13IN14b.swf~L13IN15a.swf~L13IN15b.swf~L13IN16.swf~L13IN17a.swf~L13IN17b.swf~L13IN18.swf~L13IN19.swf~L13IN20.swf~L13IN21a.swf~L13IN21b.swf~L13IN22.swf~L13IN23.swf~L13IN24.swf~L13IN25.swf~L13IN26.swf[Details_Split][Section5Details]~TI~L13TI01.swf~L13TI02.swf~L13TI03.swf~L13TI04.swf~L13TI05.swf~L13TI06.swf~L13TI07.swf~L13TI08.swf~L13TI09.swf~L13TI10.swf~L13TI11.swf[Details_Split][Section6Details]~GS~L13GS01.swf~L13GS02.swf[Details_Split][Section7Details]~TS~L13TS01.swf~L13TS02.swf~L13TS03.swf~L13TS04.swf~L13TS05.swf~L13TS06.swf~L13TS07.swf~L13TS08.swf[Details_Split][Section8Details]~FQ~L13FQ01.swf~L13FQ02.swf~L13FQ03.swf";
SlideSpaceDetails = "[Section1Details]~IR[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~3~6~10~12~13[Details_Split][Section4Details]~IN~4~5~7~8~9~10~13~15~16~17~18~19[Details_Split][Section5Details]~TI[Details_Split][Section6Details]~GS[Details_Split][Section7Details]~TS[Details_Split][Section8Details]~FQ";
RandomAudioDetails = "[Section1Details]~IR~L13RW01.swf[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~L13VB01.swf[Details_Split][Section4Details]~IN~L13IN01.swf[Details_Split][Section5Details]~TI~L13TI01.swf[Details_Split][Section6Details]~GS~L13GS01.swf[Details_Split][Section7Details]~TS";
BGTextDetails = "[Section1Details]~IR~L13RW01.swf[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~L13VB01.swf[Details_Split][Section4Details]~IN~L13IN01.swf[Details_Split][Section5Details]~TI~L13TI01.swf[Details_Split][Section6Details]~GS~L13GS01.swf[Details_Split][Section7Details]~TS~L13TS01.swf";
_focusrect = false;
fscommand("fullscreen","true");
fscommand("allowscale","true");
fscommand("showmenu","false");
fscommand("trapallkeys","true");
_global.arrDetails_Split = new Array();
_global.arrDetails_Split = LessonDetails.split("[Details_Split]");
_global.arrCourse_Details = new Array();
_global.arrCourse_Details = _global.arrDetails_Split[0].split("~");
_global.arrSection1_Details = new Array();
_global.arrSection1_Details = _global.arrDetails_Split[1].split("~");
_global.arrSection2_Details = new Array();
_global.arrSection2_Details = _global.arrDetails_Split[2].split("~");
_global.arrSection3_Details = new Array();
_global.arrSection3_Details = _global.arrDetails_Split[3].split("~");
_global.arrSection4_Details = new Array();
_global.arrSection4_Details = _global.arrDetails_Split[4].split("~");
_global.arrSection5_Details = new Array();
_global.arrSection5_Details = _global.arrDetails_Split[5].split("~");
_global.arrSection6_Details = new Array();
_global.arrSection6_Details = _global.arrDetails_Split[6].split("~");
_global.arrSection7_Details = new Array();
_global.arrSection7_Details = _global.arrDetails_Split[7].split("~");
_global.arrSection8_Details = new Array();
_global.arrSection8_Details = _global.arrDetails_Split[8].split("~");
_global.arrSlideSpaceDetails_Split = new Array();
_global.arrSlideSpaceDetails_Split = SlideSpaceDetails.split("[Details_Split]");
_global.arrSSDSec1_Details = new Array();
_global.arrSSDSec1_Details = _global.arrSlideSpaceDetails_Split[0].split("~");
_global.arrSSDSec2_Details = new Array();
_global.arrSSDSec2_Details = _global.arrSlideSpaceDetails_Split[1].split("~");
_global.arrSSDSec3_Details = new Array();
_global.arrSSDSec3_Details = _global.arrSlideSpaceDetails_Split[2].split("~");
_global.arrSSDSec4_Details = new Array();
_global.arrSSDSec4_Details = _global.arrSlideSpaceDetails_Split[3].split("~");
_global.arrSSDSec5_Details = new Array();
_global.arrSSDSec5_Details = _global.arrSlideSpaceDetails_Split[4].split("~");
_global.arrSSDSec6_Details = new Array();
_global.arrSSDSec6_Details = _global.arrSlideSpaceDetails_Split[5].split("~");
_global.arrSSDSec7_Details = new Array();
_global.arrSSDSec7_Details = _global.arrSlideSpaceDetails_Split[6].split("~");
_global.arrSSDSec8_Details = new Array();
_global.arrSSDSec8_Details = _global.arrSlideSpaceDetails_Split[7].split("~");
_global.arrRndAudioDetails_Split = new Array();
_global.arrRndAudioDetails_Split = RandomAudioDetails.split("[Details_Split]");
_global.arrRndSec1_Details = new Array();
_global.arrRndSec1_Details = _global.arrRndAudioDetails_Split[0].split("~");
_global.arrRndSec2_Details = new Array();
_global.arrRndSec2_Details = _global.arrRndAudioDetails_Split[1].split("~");
_global.arrRndSec3_Details = new Array();
_global.arrRndSec3_Details = _global.arrRndAudioDetails_Split[2].split("~");
_global.arrRndSec4_Details = new Array();
_global.arrRndSec4_Details = _global.arrRndAudioDetails_Split[3].split("~");
_global.arrRndSec5_Details = new Array();
_global.arrRndSec5_Details = _global.arrRndAudioDetails_Split[4].split("~");
_global.arrRndSec6_Details = new Array();
_global.arrRndSec6_Details = _global.arrRndAudioDetails_Split[5].split("~");
_global.arrRndSec7_Details = new Array();
_global.arrRndSec7_Details = _global.arrRndAudioDetails_Split[6].split("~");
_global.arrRndSec8_Details = new Array();
_global.arrRndSec8_Details = _global.arrRndAudioDetails_Split[7].split("~");
_global.arrBGTextDetails_Split = new Array();
_global.arrBGTextDetails_Split = BGTextDetails.split("[Details_Split]");
_global.arrBGTextSec1_Details = new Array();
_global.arrBGTextSec1_Details = _global.arrBGTextDetails_Split[0].split("~");
_global.arrBGTextSec2_Details = new Array();
_global.arrBGTextSec2_Details = _global.arrBGTextDetails_Split[1].split("~");
_global.arrBGTextSec3_Details = new Array();
_global.arrBGTextSec3_Details = _global.arrBGTextDetails_Split[2].split("~");
_global.arrBGTextSec4_Details = new Array();
_global.arrBGTextSec4_Details = _global.arrBGTextDetails_Split[3].split("~");
_global.arrBGTextSec5_Details = new Array();
_global.arrBGTextSec5_Details = _global.arrBGTextDetails_Split[4].split("~");
_global.arrBGTextSec6_Details = new Array();
_global.arrBGTextSec6_Details = _global.arrBGTextDetails_Split[5].split("~");
_global.arrBGTextSec7_Details = new Array();
_global.arrBGTextSec7_Details = _global.arrBGTextDetails_Split[6].split("~");
_global.arrBGTextSec8_Details = new Array();
_global.arrBGTextSec8_Details = _global.arrBGTextDetails_Split[7].split("~");
_global.BmId = "";
_global.tempBook = "";
_global.splitStart = 0;
_global.splitEnd = 0;
_global.sectionNumber = 0;
_global.slideNumber = 0;
_global.quizeSection;
_global.autoLoadMovie = false;
_global.lngEng = new Array();
_global.lngSpan = new Array();
_global.DescArray = new Array();
_global.KeyAttribute = "";
_global.KeyLngEng = "";
_global.KeyLngSpan = "";
_global.KeyTotDescText = "";
_global.KeyTermVar = keyTermVar;
_global.BackFlag = false;
_global.LngFlag = "English";
_global.arrGoBack = new Array();
_global.arrFinishSlide = new Array();
_global.timing1 = false;
_global.timing2 = false;
_global.timing3 = false;
_global.timing4 = false;
_global.timing5 = false;
_global.timing6 = false;
_global.timing7 = false;
_global.TimeTaken1 = "00:00:00:00";
_global.TimeTaken2 = "00:00:00:00";
_global.TimeTaken3 = "00:00:00:00";
_global.TimeTaken4 = "00:00:00:00";
_global.TimeTaken5 = "00:00:00:00";
_global.TimeTaken6 = "00:00:00:00";
_global.TimeTaken7 = "00:00:00:00";
_global.startTime = 0;
_global.quizSection = false;
_global.playaction = false;
_global.Mute = false;
_global.Pause = false;
_global.Play = true;
_global.CompClick = "";
_global.gSound = new Sound();
_global.VolLevel = 100;
_global.needMoreBackURL = "";
_global.randomAudio = false;
_global.spanAudio = false;
_global.arrKeyTermBank = new Array();
_global.backLinkWord = "";
_global.openScrKey = true;
_global.closeApp = "no";
myCookie = SharedObject.getLocal("cookiename");
tempFLCookieCount = 0;
_global.arrayFLCookie = new Array();
if(_root.getBytesLoaded() >= _root.getBytesTotal())
{
   gotoAndStop("start");
   play();
}
else
{
   loadInt = int(_root._root.getBytesLoaded() / _root.getBytesTotal());
   load = loadInt + "% Loaded";
   _root.bar.gotoAndStop(int(loadInt));
}
tempURL = _root._url;
splTempURL = tempURL.split("index");
_global.tempURL = splTempURL[0].substring(0,splTempURL[0].length - 1);
_global.xmlPath = "../../../HELP_KEYTERMS/KT/ELEMENTARY/";
tempRemMcInt = 1;
i = 1;
while(i <= 1000)
{
   if(eval("instance" + i)._name != undefined)
   {
      if(eval("instance" + i)._x > -12 && eval("instance" + i)._x < 800 && eval("instance" + i)._y > 33 && eval("instance" + i)._y < 450)
      {
         eval("instance" + i)._visible = false;
      }
   }
   i++;
}
