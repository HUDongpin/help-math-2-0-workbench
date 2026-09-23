//Vars Starts
//LessonDetails = "[CourseDetails]~CourseName,Counting on Numbers~LessonName,Counting on Numbers~TotalSection,8[Details_Split][Section1Details]~IR~L2RW01.swf[Details_Split][Section2Details]~RW~L2RW02.swf~L2RW03.swf~L2RW04.swf~L2RW05.swf[Details_Split][Section3Details]~VB~L2VB01.swf~L2VB02.swf~L2VB03.swf~L2VB04.swf~L2VB05.swf~L2VB06.swf~L2VB07.swf~L2VB08.swf~L2VB09.swf~L2VB10.swf~L2VB11.swf~L2VB12.swf~L2VB13.swf~L2VB14.swf[Details_Split][Section4Details]~IN~L2IN01.swf~L2IN02.swf~L2IN03.swf~L2IN04.swf~L2IN05.swf~L2IN06.swf~L2IN07.swf~L2IN08.swf~L2IN09.swf~L2IN10.swf~L2IN11.swf~L2IN12.swf~L2IN13.swf~L2IN14.swf~L2IN15.swf~L2IN16.swf~L2IN17.swf~L2IN18.swf~L2IN19.swf~L2IN20.swf~L2IN21.swf~L2IN22.swf~L2IN23.swf~L2IN24.swf~L2IN25.swf~L2IN26.swf~L2IN27.swf~L2IN28.swf~L2IN29.swf~L2IN30.swf~L2IN31.swf~L2IN32.swf[Details_Split][Section5Details]~TI~L2TI01.swf~L2TI02.swf~L2TI03.swf~L2TI04.swf~L2TI05.swf~L2TI06.swf~L2TI07.swf~L2TI08.swf~L2TI09.swf~L2TI10.swf[Details_Split][Section6Details]~GS~L2GS01.swf~L2GS02.swf~L2GS03.swf[Details_Split][Section7Details]~TS~L2TS01.swf~L2TS02.swf~L2TS03.swf~L2TS04.swf~L2TS05.swf~L2TS06.swf~L2TS07.swf~L2TS08.swf[Details_Split][Section8Details]~FQ~L2FQ01.swf~L2FQ02.swf";
LessonDetails = "[CourseDetails]~CourseName,Counting on Numbers~LessonName,Counting on Numbers~TotalSection,8[Details_Split][Section1Details]~IR~L2RW01.swf[Details_Split][Section2Details]~RW~L2RW02.swf~L2RW03.swf~L2RW04.swf~L2RW05.swf[Details_Split][Section3Details]~VB~L2VB01.swf~L2VB02.swf~L2VB03.swf~L2VB04.swf~L2VB05.swf~L2VB06.swf~L2VB07.swf~L2VB08.swf~L2VB09.swf~L2VB10.swf~L2VB11.swf~L2VB12.swf~L2VB13.swf~L2VB14.swf[Details_Split][Section4Details]~IN~L2IN01.swf~L2IN02.swf~L2IN03.swf~L2IN04.swf~L2IN05.swf~L2IN06.swf~L2IN07.swf~L2IN08.swf~L2IN09.swf~L2IN10.swf~L2IN11.swf~L2IN12.swf~L2IN13.swf~L2IN14.swf~L2IN15.swf~L2IN16.swf~L2IN17.swf~L2IN18.swf~L2IN19.swf~L2IN20.swf~L2IN21.swf~L2IN22.swf~L2IN23.swf~L2IN24.swf~L2IN25.swf~L2IN26.swf~L2IN27.swf~L2IN28.swf~L2IN29.swf~L2IN30.swf~L2IN31.swf~L2IN32.swf[Details_Split][Section5Details]~TI~L2TI01.swf~L2TI02.swf~L2TI03.swf~L2TI04.swf~L2TI05.swf~L2TI06.swf~L2TI07.swf~L2TI08.swf~L2TI09.swf~L2TI10.swf[Details_Split][Section6Details]~GS~L2GS01.swf~L2GS02.swf~L2GS03.swf[Details_Split][Section7Details]~TS~L2TS01.swf~L2TS02.swf~L2TS03.swf~L2TS04.swf~L2TS05.swf~L2TS06.swf~L2TS07.swf~L2TS08.swf[Details_Split][Section8Details]~FQ~L2FQ01.swf~L2FQ02.swf~L2FQ03.swf";
SlideSpaceDetails = "[Section1Details]~IR[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~6~7~10~11~13[Details_Split][Section4Details]~IN~3~4~6~17~20~21~22~23~24~27~32[Details_Split][Section5Details]~TI[Details_Split][Section6Details]~GS[Details_Split][Section7Details]~TS[Details_Split][Section8Details]~FQ";
RandomAudioDetails = "[Section1Details]~IR~L2RW01.swf[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~L2VB01.swf[Details_Split][Section4Details]~IN~L2IN01.swf[Details_Split][Section5Details]~TI~L2TI01.swf[Details_Split][Section6Details]~GS~L2GS01.swf[Details_Split][Section7Details]~TS";
BGTextDetails = "[Section1Details]~IR~L2RW01.swf[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~L2VB01.swf[Details_Split][Section4Details]~IN~L2IN01.swf[Details_Split][Section5Details]~TI~L2TI01.swf[Details_Split][Section6Details]~GS~L2GS01.swf[Details_Split][Section7Details]~TS~L2TS01.swf";
//Vars End

function doCreateSlide() {
	for (i=2; i<_global.arrSection1_Details.length; i++) {
		mcName = _global.arrSection1_Details[i].substring(0, _global.arrSection1_Details[i].length-4);
		removeMovieClip(mcName);
	}
	for (i=2; i<_global.arrSection2_Details.length; i++) {
		mcName = _global.arrSection2_Details[i].substring(0, _global.arrSection2_Details[i].length-4);
		removeMovieClip(mcName);
	}
	for (i=2; i<_global.arrSection3_Details.length; i++) {
		mcName = _global.arrSection3_Details[i].substring(0, _global.arrSection3_Details[i].length-4);
		removeMovieClip(mcName);
	}
	for (i=2; i<_global.arrSection4_Details.length; i++) {
		mcName = _global.arrSection4_Details[i].substring(0, _global.arrSection4_Details[i].length-4);
		removeMovieClip(mcName);
	}
	for (i=2; i<_global.arrSection5_Details.length; i++) {
		mcName = _global.arrSection5_Details[i].substring(0, _global.arrSection5_Details[i].length-4);
		removeMovieClip(mcName);
	}
	for (i=2; i<_global.arrSection6_Details.length; i++) {
		mcName = _global.arrSection6_Details[i].substring(0, _global.arrSection6_Details[i].length-4);
		removeMovieClip(mcName);
	}
	for (i=2; i<_global.arrSection7_Details.length; i++) {
		mcName = _global.arrSection7_Details[i].substring(0, _global.arrSection7_Details[i].length-4);
		removeMovieClip(mcName);
	}
	for (i=2; i<_global.arrSection8_Details.length; i++) {
		mcName = _global.arrSection8_Details[i].substring(0, _global.arrSection8_Details[i].length-4);
		removeMovieClip(mcName);
	}
	var flgExists:Boolean;
	flgExists = false;
	var mcName:String;
	var intSlideNum:Number;
	if (_global.sectionNumber == 1) {
		slideName = new Array();
		slideName[0] = "Introduction";
		var slideSpace:Boolean;
		mcX = 16;
		intSlideNum = 0;
		for (i=2; i<_global.arrSection1_Details.length; i++) {
			intSlideNum++;
			mcName = _global.arrSection1_Details[i].substring(0, _global.arrSection1_Details[i].length-4);
			duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);
			eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
			if (i == 2) {
				eval(mcName)._x = 16;
				eval(mcName)._y = 535;
			} else {
				slideSpace = false;
				for (j=2; j<_global.arrSSDSec1_Details.length; j++) {
					if (_global.arrSSDSec1_Details[j] == intSlideNum) {
						slideSpace = true;
					}
				}
				if (slideSpace) {
					mcX = mcX+18;
				} else {
					mcX = mcX+30;
				}
				eval(mcName)._x = mcX;
			}
			eval(mcName).SlideNum._visible = false;
		}
		_global.createSlide1 = true;
	}
	if (_global.sectionNumber == 2) {
				var slideSpace:Boolean;
				mcX = 16;
				//intSlideNum = 0;
				intSlideNum = 1;
				slideName = new Array();
				//slideName[0] = "Introduction";
				slideName[1] = "Page 1";
				slideName[2] = "Page 2";
				slideName[3] = "Page 3";
				slideName[4] = "Page 4";
				
				for (i=2; i<_global.arrSection2_Details.length; i++) {
					intSlideNum++;
					mcName = _global.arrSection2_Details[i].substring(0, _global.arrSection2_Details[i].length-4);
					duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);
					eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
					if (i == 2) {
						eval(mcName)._x = 16;
						eval(mcName)._y = 535;
					} else {
						slideSpace = false;
						for (j=2; j<_global.arrSSDSec2_Details.length; j++) {
							if (_global.arrSSDSec2_Details[j] == intSlideNum) {
								slideSpace = true;
							}
						}
						if (slideSpace) {
							mcX = mcX+18;
						} else {
							mcX = mcX+30;
						}
						eval(mcName)._x = mcX;
					}
					eval(mcName).SlideNum._visible = false;
				}
				_global.createSlide2 = true;
	}
	if (_global.sectionNumber == 3) {
		var slideSpace:Boolean;
		mcX = 16;
		intSlideNum = 0;
		slideName = new Array();
		
		slideName[0] = "Introduction";
		
		slideName[1] = "Symbols";	
		
		slideName[2] = "Model";
		
		slideName[3] = "Addition";
		
		slideName[4] = "Addend, Sum";	
		slideName[5] = "Addend, Sum";			
		slideName[6] = "Addend, Sum Practice";
				
		slideName[7] = "Subtraction";
		
		slideName[8] = "Difference";
		slideName[9] = "Difference";
		slideName[10] = "Difference Practice";	
		
		slideName[11] = "Mental Math";
		slideName[12] = "Mental Math";	
		
		slideName[13] = "Inverse Operations";
						
		for (i=2; i<_global.arrSection3_Details.length; i++) {
			intSlideNum++;
			mcName = _global.arrSection3_Details[i].substring(0, _global.arrSection3_Details[i].length-4);
			duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);
			eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
			if (i == 2) {
				eval(mcName)._x = 16;
				eval(mcName)._y = 535;
			} else {
				slideSpace = false;
				for (j=2; j<_global.arrSSDSec3_Details.length; j++) {
					if (_global.arrSSDSec3_Details[j] == intSlideNum) {
						slideSpace = true;
					}
				}
				if (slideSpace) {
					mcX = mcX+18;
				} else {
					mcX = mcX+30;
				}
				eval(mcName)._x = mcX;
			}
			eval(mcName).SlideNum._visible = false;
		}
		_global.createSlide3 = true;

	}
		
	if (_global.sectionNumber == 4) {
		var slideSpace:Boolean;
		mcX = 16;
		slideName = new Array();
		slideName[0] = "Introduction";

		slideName[1] = "Review Addition Facts Using Base Ten Blocks";				
		slideName[2] = "Review Addition Facts Using Base Ten Blocks";
		slideName[3] = "Review Addition Facts Using Base Ten Blocks Practice";

		slideName[4] = "Addition Fact Tables";
		slideName[5] = "Addition Fact Tables";		

		slideName[6] = "Addend and Sum";
		
		slideName[7] = "Addition Facts Practice";

		slideName[8] = "Adding Using Mental Math";				

		slideName[9] = "Adding 2 Digit Numbers without Regrouping";
		
		slideName[10] = "Addition Using A Calculator";

		slideName[11] = "Addition Practice";

		slideName[12] = "Adding with Regrouping";
		
		slideName[13] = "Addition Equations";
		
		slideName[14] = "Addition Problem Solving";
		
		slideName[15] = "Addition Equations with Three - digit Numbers";
		slideName[16] = "Addition of Four-digit and Five-digit Numbers";

		slideName[17] = "Addition Sentences Practice";
		
		//second split
		
		slideName[18] = "Subtraction";
		slideName[19] = "Finding Differences";		
		slideName[20] = "Subtraction Fact Models";		
		slideName[21] = "Finding Differences";		
		slideName[22] = "Subtraction Facts Practice";
		slideName[23] = "Subtraction Facts";
		
		slideName[24] = "Subtracting Tens";

		slideName[25] = "Subtraction with Regrouping/Borrowing";		
		slideName[26] = "Subtraction Problem Solving";

		slideName[27] = "Subtraction Equations and Two Digit Numbers";	
		
		slideName[28] = "Subtraction with Three Digit Numbers and Renaming (Borrowing)";
		
		slideName[29] = "Subtraction Using a Calculator";

		slideName[30] = "Subtraction Using Pencil and Paper";		
		slideName[31] = "Subtraction Practice";
		
		if (_global.splitStart == 0 || _global.splitEnd == 0) {
			intSlideNum = 0;
			for (i=2; i<_global.arrSection4_Details.length; i++) {
				intSlideNum++;
				mcName = _global.arrSection4_Details[i].substring(0, _global.arrSection4_Details[i].length-4);
				duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);
				eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
				if (i == 2) {
					eval(mcName)._x = 16;
					eval(mcName)._y = 535;
				} else {
					slideSpace = false;
					for (j=2; j<_global.arrSSDSec4_Details.length; j++) {
						if (_global.arrSSDSec4_Details[j] == intSlideNum) {
							slideSpace = true;
						}
					}
					if (slideSpace) {
						mcX = mcX+18;
					} else {
						mcX = mcX+30;
					}
					eval(mcName)._x = mcX;
				}
				eval(mcName).SlideNum._visible = false;
			}
			_global.createSlide4 = true;
		} else {
			intSlideNum = _global.splitStart-2;
			for (i=_global.splitStart; i<=_global.splitEnd; i++) {
				intSlideNum++;
				mcName = _global.arrSection4_Details[i].substring(0, _global.arrSection4_Details[i].length-4);
				duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);
				eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
				if (i == _global.splitStart) {
					eval(mcName)._x = 16;
					eval(mcName)._y = 535;
				} else {
					slideSpace = false;
					for (j=2; j<_global.arrSSDSec4_Details.length; j++) {
						if (_global.arrSSDSec4_Details[j] == intSlideNum) {
							slideSpace = true;
						}
					}
					if (slideSpace) {
						mcX = mcX+18;
					} else {
						mcX = mcX+30;
					}
					eval(mcName)._x = mcX;
				}
				eval(mcName).SlideNum._visible = false;
			}
			_global.createSlide4 = true;
		}
	}

	if (_global.sectionNumber == 5) {
		var slideSpace:Boolean;
		mcX = 16;
		intSlideNum = 0;
		slideName = new Array();
		slideName[0] = "Introduction";
		slideName[1] = "Question 1";
		slideName[2] = "Question 2";
		slideName[3] = "Question 3";
		slideName[4] = "Question 4";
		slideName[5] = "Question 5";
		slideName[6] = "Question 6";
		slideName[7] = "Question 7";
		slideName[8] = "Question 8";
		slideName[9] = "Question 9";

		for (i=2; i<_global.arrSection5_Details.length; i++) {
			intSlideNum++;
			mcName = _global.arrSection5_Details[i].substring(0, _global.arrSection5_Details[i].length-4);
			duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);
			eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
			if (i == 2) {
				eval(mcName)._x = 16;
				eval(mcName)._y = 535;
			} else {
				slideSpace = false;
				for (j=2; j<_global.arrSSDSec5_Details.length; j++) {
					if (_global.arrSSDSec5_Details[j] == intSlideNum) {
						slideSpace = true;
					}
				}
				if (slideSpace) {
					mcX = mcX+16;
				} else {
					mcX = mcX+37;
				}
				eval(mcName)._x = mcX;
			}
			eval(mcName).SlideNum._visible = false;
		}
		_global.createSlide5 = true;
	}
	if (_global.sectionNumber == 6) {
		var slideSpace:Boolean;
		mcX = 16;
		intSlideNum = 0;
		slideName = new Array();
		slideName[0] = "Introduction";
		slideName[1] = "Game 1";
		slideName[2] = "Game 2";
		for (i=2; i<_global.arrSection6_Details.length; i++) {
			intSlideNum++;
			mcName = _global.arrSection6_Details[i].substring(0, _global.arrSection6_Details[i].length-4);
			duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);
			eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
			if (i == 2) {
				eval(mcName)._x = 16;
				eval(mcName)._y = 535;
			} else {
				slideSpace = false;
				for (j=2; j<_global.arrSSDSec6_Details.length; j++) {
					if (_global.arrSSDSec6_Details[j] == intSlideNum) {
						slideSpace = true;
					}
				}
				if (slideSpace) {
					mcX = mcX+18;
				} else {
					mcX = mcX+30;
				}
				eval(mcName)._x = mcX;
			}
			eval(mcName).SlideNum._visible = false;
		}
		_global.createSlide6 = true;
	}
	if (_global.sectionNumber == 7) {
		var slideSpace:Boolean;
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
		
		for (i=2; i<_global.arrSection7_Details.length; i++) {
			intSlideNum++;
			mcName = _global.arrSection7_Details[i].substring(0, _global.arrSection7_Details[i].length-4);
			duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);
			eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
			if (i == 2) {
				eval(mcName)._x = 16;
				eval(mcName)._y = 535;
			} else {
				slideSpace = false;
				for (j=2; j<_global.arrSSDSec7_Details.length; j++) {
					if (_global.arrSSDSec7_Details[j] == intSlideNum) {
						slideSpace = true;
					}
				}
				if (slideSpace) {
					mcX = mcX+18;
				} else {
					mcX = mcX+30;
				}
				eval(mcName)._x = mcX;
			}
			eval(mcName).SlideNum._visible = false;
		}
		_global.createSlide7 = true;
	}
	if (_global.sectionNumber == 8) {
		var slideSpace:Boolean;
		mcX = 16;
		intSlideNum = 0;
		slideName = new Array();
		slideName[0] = "Introduction";
		slideName[1] = "Page 1";
		slideName[2] = "Page 2";
		for (i=2; i<_global.arrSection8_Details.length; i++) {
			intSlideNum++;
			mcName = _global.arrSection8_Details[i].substring(0, _global.arrSection8_Details[i].length-4);
			duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);
			eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
			if (i == 2) {
				eval(mcName)._x = 16;
				eval(mcName)._y = 535;
			} else {
				slideSpace = false;
				for (j=2; j<_global.arrSSDSec8_Details.length; j++) {
					if (_global.arrSSDSec8_Details[j] == intSlideNum) {
						slideSpace = true;
					}
				}
				if (slideSpace) {
					mcX = mcX+18;
				} else {
					mcX = mcX+30;
				}
				eval(mcName)._x = mcX;
			}
			eval(mcName).SlideNum._visible = false;
		}
		_global.createSlide8 = true;
	}
}

function doPlayPreviousMovie() {
	_global.Play = true;
	_global.Pause = false;
	_global.CompClick = "";
	_global.quizSection = false;
	_global.needMoreBackURL = "";
	_global.slideNumber--;
	_root.animation_mc.unloadMovie();
	_root.glossary.keyterms.mouse_down._x = _root.glossary.keyterms.x_pos;
	_root.glossary.keyterms.mouse_down._y = _root.glossary.keyterms.y_pos;
	_root.glossary._visible = false;
	_root.calculator._visible = false;
	_root.m_c._visible = false;
	_root.popup.gotoAndStop(1);
	_root.next_mc.gotoAndStop("inactive");
	_root.replay_mc.gotoAndStop("inactive");
	if (_global.sectionNumber == 1) {
		if (_global.slideNumber<2) {
			_global.sectionNumber = 1;
			_global.slideNumber = 2;
		}
		_global.playSwfFileName = _global.tempURL+"/IR/"+_global.arrSection1_Details[_global.slideNumber];
		_root.loadSWFMovie();
	}
	if (_global.sectionNumber == 2) {
		if (_global.slideNumber<2) {
			_global.sectionNumber = 1;
			_global.slideNumber = _global.arrSection1_Details.length-1;
			_global.playSwfFileName = _global.tempURL+"/IR/"+_global.arrSection1_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/RW/"+_global.arrSection2_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 3) {
		if (_global.slideNumber<2) {
			_global.sectionNumber = 2;
			_global.slideNumber = _global.arrSection2_Details.length-1;
			_global.playSwfFileName = _global.tempURL+"/RW/"+_global.arrSection2_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/VB/"+_global.arrSection3_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 4) {
		/*if (_global.slideNumber+1 == 21) {
			_global.splitStart = 2;
			_global.splitEnd = 20;*/
			
			if (_global.slideNumber+1 == 20) {
				_global.splitStart = 2;
				_global.splitEnd = 19;
			_global.playSwfFileName = _global.tempURL+"/IN/"+_global.arrSection4_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
		if (_global.slideNumber<2) {
			_global.sectionNumber = 3;
			_global.slideNumber = _global.arrSection3_Details.length-1;
			_global.playSwfFileName = _global.tempURL+"/VB/"+_global.arrSection3_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/IN/"+_global.arrSection4_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 5) {
		if (_global.slideNumber<2) {
			_global.sectionNumber = 4;
			
			/*_global.splitStart = 21;
			_global.splitEnd = 39;*/
			
			_global.splitStart = 20;
			_global.splitEnd = 33;
			
			_global.slideNumber = _global.arrSection4_Details.length-1;
			_global.playSwfFileName = _global.tempURL+"/IN/"+_global.arrSection4_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/TI/"+_global.arrSection5_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 6) {
		if (_global.slideNumber<2) {
			_global.sectionNumber = 5;
			_global.slideNumber = _global.arrSection5_Details.length-1;
			_global.playSwfFileName = _global.tempURL+"/TI/"+_global.arrSection5_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/GS/"+_global.arrSection6_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 7) {
		if (_global.slideNumber<2) {
			_global.sectionNumber = 6;
			_global.slideNumber = _global.arrSection6_Details.length-1;
			_global.playSwfFileName = _global.tempURL+"/GS/"+_global.arrSection6_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/TS/"+_global.arrSection7_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 8) {
		if (_global.slideNumber<2) {
			_global.sectionNumber = 7;
			_global.slideNumber = _global.arrSection7_Details.length-1;
			_global.playSwfFileName = _global.tempURL+"/TS/"+_global.arrSection7_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/FQ/"+_global.arrSection8_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
}
function doPlayNextMovie() {
	_global.Play = true;
	_global.Pause = false;
	_global.CompClick = "";
	_global.quizSection = false;
	_global.needMoreBackURL = "";
	_global.slideNumber++;
	_root.animation_mc.unloadMovie();
	_root.glossary.keyterms.mouse_down._x = _root.glossary.keyterms.x_pos;
	_root.glossary.keyterms.mouse_down._y = _root.glossary.keyterms.y_pos;
	_root.glossary._visible = false;
	_root.calculator._visible = false;
	_root.m_c._visible = false;
	_root.popup.gotoAndStop(1);
	_root.next.gotoAndStop("inactive");
	_root.replay.gotoAndStop("inactive");
	if (_global.sectionNumber == 1) {
		if (_global.slideNumber>_global.arrSection1_Details.length-1) {
			_global.sectionNumber = 2;
			_global.slideNumber = 2;
			_global.playSwfFileName = _global.tempURL+"/RW/"+_global.arrSection2_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/IR/"+_global.arrSection1_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 2) {
		if (_global.slideNumber>_global.arrSection2_Details.length-1) {
			_global.sectionNumber = 3;
			_global.slideNumber = 2;
			_global.playSwfFileName = _global.tempURL+"/VB/"+_global.arrSection3_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/RW/"+_global.arrSection2_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 3) {
		if (_global.slideNumber>_global.arrSection3_Details.length-1) {
			_global.sectionNumber = 4;
			_global.slideNumber = 2;
			
			/*_global.splitStart = 2;			
			_global.splitEnd = 20;*/
			
			_global.splitStart = 2;			
			_global.splitEnd = 19;
			
			_global.playSwfFileName = _global.tempURL+"/IN/"+_global.arrSection4_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/VB/"+_global.arrSection3_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 4) {
		/*if (_global.slideNumber-1 == 20) {
			_global.splitStart = 21;
			_global.splitEnd = 39;*/
			
			if (_global.slideNumber-1 == 19) {
				_global.splitStart = 20;
				_global.splitEnd = 33;
				
			_global.playSwfFileName = _global.tempURL+"/IN/"+_global.arrSection4_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
		if (_global.slideNumber>_global.arrSection4_Details.length-1) {
			_global.sectionNumber = 5;
			_global.slideNumber = 2;
			_global.playSwfFileName = _global.tempURL+"/TI/"+_global.arrSection5_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/IN/"+_global.arrSection4_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 5) {
		if (_global.slideNumber>_global.arrSection5_Details.length-1) {
			_global.sectionNumber = 6;
			_global.slideNumber = 2;
			_global.playSwfFileName = _global.tempURL+"/GS/"+_global.arrSection6_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/TI/"+_global.arrSection5_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 6) {
		if (_global.slideNumber>_global.arrSection6_Details.length-1) {
			_global.sectionNumber = 7;
			_global.slideNumber = 2;
			_global.playSwfFileName = _global.tempURL+"/TS/"+_global.arrSection7_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/GS/"+_global.arrSection6_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 7) {
		if (_global.slideNumber>_global.arrSection7_Details.length-1) {
			_global.sectionNumber = 8;
			_global.slideNumber = 2;
			_global.playSwfFileName = _global.tempURL+"/FQ/"+_global.arrSection8_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/TS/"+_global.arrSection7_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 8) {
		if (_global.slideNumber>_global.arrSection8_Details.length-1) {
			_global.sectionNumber = 8;
			_global.slideNumber = _global.arrSection8_Details.length-1;
		}
		_global.playSwfFileName = _global.tempURL+"/FQ/"+_global.arrSection8_Details[_global.slideNumber];
		_root.doPutBackAndFinished();
		_root.loadSWFMovie();
	}
}
function doCheckSpanishAudio() {
	_root.dtfSPANISH.text = "ON";
	if (_root.dtfSPANISH.text == "ON") {
		if (_global.spanSound != true) {
			if (_global.sectionNumber == 2 || _global.sectionNumber == 3 || _global.sectionNumber == 4 || _global.sectionNumber == 5 || _global.sectionNumber == 6 || _global.sectionNumber == 7) {
				if (_global.playSwfFileName != _global.tempURL+"/RW/L2RW01.swf" && _global.playSwfFileName != _global.tempURL+"/VB/L2VB01.swf" && _global.playSwfFileName != _global.tempURL+"/IN/L2IN01.swf" && _global.playSwfFileName != _global.tempURL+"/GS/L2GS01.swf" && _global.playSwfFileName != _global.tempURL+"/TI/L2TI01.swf" && _global.playSwfFileName != _global.tempURL+"/TS/L2TS01.swf" ) {
					_root.SA._visible = true;
					_root.EA._visible = true;

					_root.SA_PLAY._visible=false;
					_root.SA_PAUSE._visible=false;
					
					_root.SA._alpha = 100;
					_root.EA._alpha = 100;
				} else {
					_root.SA._visible = false;
					_root.EA._visible = false;
					
					_root.SA_PLAY._visible=false;
					_root.SA_PAUSE._visible=false;
					
					_root.SA._alpha = 0;
					_root.EA._alpha = 0;
				}
			} else {
				_root.SA._visible = false;
				_root.EA._visible = false;
				
				_root.SA_PLAY._visible=false;
				_root.SA_PAUSE._visible=false;
					
				_root.SA._alpha = 0;
				_root.EA._alpha = 0;
			}
		}
	} else {
		_root.SA._visible = false;
		_root.EA._visible = false;
		
		_root.SA_PLAY._visible=false;
		_root.SA_PAUSE._visible=false;
					
		_root.SA._alpha = 0;
		_root.EA._alpha = 0;
	}
}