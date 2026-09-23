focusrect = false;
fscommand("fullscreen", "true");
fscommand("allowscale", "true");
fscommand("showmenu", "false");
fscommand("trapallkeys", "true");

_global.arrDetails_Split = new Array();
_global.arrDetails_Split = LessonDetails.split('[Details_Split]');

_global.arrCourse_Details = new Array();
_global.arrCourse_Details = _global.arrDetails_Split[0].split('~');

_global.arrRndAudioDetails_Split = new Array();
_global.arrRndAudioDetails_Split = RandomAudioDetails.split('[Details_Split]');

_global.arrBGTextDetails_Split = new Array();
_global.arrBGTextDetails_Split = BGTextDetails.split('[Details_Split]');

_global.arrayTotalSectionDetails = new Array();
_global.arrayTotalRndAudioDetails = new Array();
_global.arrayTotalBgTextDetails = new Array();

for (i=1;i<_global.arrDetails_Split.length;i++) {
	_global.arrayTotalSectionDetails.push(_global.arrDetails_Split[i]);
	
}


for (i=0;i<_global.arrRndAudioDetails_Split.length;i++) {
	_global.arrayTotalRndAudioDetails.push(_global.arrRndAudioDetails_Split[i]);
	
}
for (i=0;i<_global.arrBGTextDetails_Split.length;i++) {
	_global.arrayTotalBgTextDetails.push(_global.arrBGTextDetails_Split[i]);
	
}

_global.BmId = "";
_global.tempBook = "";
_global.splitStart = 0;
_global.splitEnd = 0;
_global.sectionNumber = -1;
_global.slideNumber = 0;
_global.startTime = 0;
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
_global.spanSound=false;
_global.arrKeyTermBank = new Array();
_global.backLinkWord = "";
_global.openScrKey = true;
_global.closeApp = "no";
_global.showLoading_Spanish = false;
_global.notepadText = "";
_root.txtWarnText._visible=false;
_root.MCtxtWarnSAText._visible = false;
_root.MCtxtWarnSAText._alpha = 0;
_root.preLoading=false;
_root.chkSlideNumber = 0;
_global.btnKeyTermsPressed = undefined;

/*************************************************************************/
//Begin JSFlashCommunication
	_root.strJSFlashVar = "";
//End JSFlashCommunication
/*************************************************************************/

/*************************************************************************/
//Begin Notepad for MLC
	_root.boolNotepadClicked = false;
	_root.strNotepadPage = "";
//End Notepad for MLC
/*************************************************************************/

/*************************************************************************/
//Begin Wall for MLC
	_root.boolWallClicked = false;
	_root.strWallPage = "";
//End Wall for MLC
/*************************************************************************/

/*************************************************************************/
//Begin Click Project Global for MLC
_root.strFinalClickURL = "";
_root.strIndexGlobalButttonClickType = "";
_root.strIndexGlobalClickDesc = "";
_root.strIndexGlobalButttonClickPage = "";
_root.intIndexGlobalButttonClickCount = "";
_root.intIndexKTButtonClickCount = 0;
_root.intIndexCALCButtonClickCount = 0;
_root.intIndexSPAudioButtonClickCount = 0;
_root.intIndexNextButtonClickCount = 0;
_root.intIndexPreviousButtonClickCount = 0;
_root.intIndexReplayButtonClickCount = 0;
_root.intIndexPauseButtonClickCount = 0;
_root.intIndexPlayButtonClickCount = 0;
_root.intIndexMuteButtonClickCount = 0;
_root.intIndexUnMuteButtonClickCount = 0;
_root.intIndexHelpButtonClickCount = 0;
//End Click Project for MLC

//Begin Click Project Individual for MLC
_root.strIndividualButttonClickPage = "";
_root.strIndividualButttonClickType = "";
_root.strIndividualClickDesc = "";
//End Click Project Individual for MLC
/*************************************************************************/


myCookie = SharedObject.getLocal("cookiename");
tempFLCookieCount = 0;
_global.arrayFLCookie = new Array();

_root.Mc_ToolTip_Bg._alpha=0;
_root.Mc_ToolTip_Bg._visible=false;

_global.arrayRemoveVBSubTitleMc = new Array();
_global.arrayRemoveINSubTitleMc = new Array();
_global.arrayRemoveTSSubTitleMc = new Array();

NavigationButtonsONOFF = "";

//Final Quiz Intro Audio Begin
_global.strLNG = "";
//Final Quiz Intro Audio End

function getBookMark() {
	for (var myVariable in myCookie.data) {
		_global.arrayFLCookie.push(myCookie.data[myVariable]);
		tempFLCookieCount++;
	}
	lessonNum = _root.Lesson_ID;
	for (i=0;i<_global.arrayFLCookie.length;i++) {
		tempSplFLC = _global.arrayFLCookie[i].split("~");
		tempFLCCheckVal = "L" add lessonNum;
		if (tempFLCCheckVal==tempSplFLC[0]) {
			_root.Bookmark_URL = tempSplFLC[1];
		}
		break;
	}
}

function setBookMark() {
	lessonNum = _root.Lesson_ID;
	tempINFLCVal = "L" add lessonNum;
	myCookie.clear();
	for (i=0;i<_global.arrayFLCookie.length;i++) {
		tempSplFLC = _global.arrayFLCookie[i].split("~");
		tempFLCCheckVal = "L" add lessonNum;
		if (tempFLCCheckVal==tempSplFLC[0]) {
			_global.arrayFLCookie.splice(i,1);
		}
		break;
	}
	
			_global.BmId = _global.splitStart+"SPLDATA"+_global.splitEnd+"SPLDATA"+_global.sectionNumber+"SPLDATA"+_global.slideNumber+"SPLDATA"+_global.playSwfFileName;
			_global.arrayFLCookie.push(tempINFLCVal add "~" add _global.BmId);

	for (i=0;i<_global.arrayFLCookie.length;i++) {
		myCookie.data[i] = _global.arrayFLCookie[i]
		myCookie.flush();
	}	
		
}

function doRemoveSquare() {		
	var flgExists;
	var mcName;
	var intSlideNum;
	tempArrSplit = _root.pageNames.split("SECSPL");
	for (i=0;i<_global.arrayTotalSectionDetails.length;i++) {
		newTempSpl = _global.arrayTotalSectionDetails[i].split("~");
		for (j=2;j<newTempSpl.length;j++) {
			splTempChkName = newTempSpl[j].substring(0, newTempSpl[j].length-4).split('/');

			tempMcName = "";
			for (k=0;k<splTempChkName.length;k++) {
				if (tempMcName=="") {
					tempMcName = splTempChkName[k];
				} else {
					tempMcName = tempMcName+","+splTempChkName[k];

				}
			}
			mcName = tempMcName;		

			removeMovieClip(_root[mcName]);
		}
	}
}

function doCreateSlide() {
	var flgExists;
	var mcName;
	var intSlideNum;
	tempArrSplit = _root.pageNames.split("SECSPL");
	for (i=0;i<_global.arrayTotalSectionDetails.length;i++) {
		newTempSpl = _global.arrayTotalSectionDetails[i].split("~");
		for (j=2;j<newTempSpl.length;j++) {
			splTempChkName = newTempSpl[j].substring(0, newTempSpl[j].length-4).split('/');
			
			tempMcName = "";
			for (k=0;k<splTempChkName.length;k++) {
				if (tempMcName=="") {
					tempMcName = splTempChkName[k];
				} else {
					tempMcName = tempMcName+","+splTempChkName[k];

				}
			}
			mcName = tempMcName;		

			removeMovieClip(_root[mcName]);
		}
	}
	if (_global.sectionNumber>=0 && _global.sectionNumber<_global.arrayTotalSectionDetails.length) {
		slideName = new Array();
		tempArrSectionSplit = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");
		tempSplSlideName = tempArrSplit[_global.sectionNumber].split("~");

		for (i=0; i<tempSplSlideName.length; i++) {
			slideName.push(tempSplSlideName[i]);
		}
		mcX = 15.5;
		intSlideNum = 0;
		for (i=2; i<tempArrSectionSplit.length; i++) {
			intSlideNum++;
			splTempChkName = tempArrSectionSplit[i].substring(0, tempArrSectionSplit[i].length-4).split('/');

			tempMcName = "";
			for (j=0;j<splTempChkName.length;j++) {
				if (tempMcName=="") {
					tempMcName = splTempChkName[j];
				} else {
					tempMcName = tempMcName+","+splTempChkName[j];

				}
			}
			mcName = tempMcName;

			if (_global.newTitleTag==true) { _global.tempLastSlideName = mcName; }
			removeMovieClip(_root[mcName]);
            duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);

			//Begin Linear and Non Linear Mode
			if (_root.dtfNoMap.text.toUpperCase()=="YES") {
				eval(mcName)._visible = false;
			}
			//End Linear and Non Linear Mode
			
			eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
			if (tempSplSlideName.length<25) {
				if (i == 2) {
					eval(mcName)._x = 15.5;
				} else {
					mcX = mcX+20;
					eval(mcName)._x = mcX;
				}
			} else {
				if (i == 2) {
					eval(mcName)._x = 15.5;
					eval(mcName)._y = 535;
				} else {
				if (i == 24) {
					mcX = 15.5;
					eval(mcName)._x = 15.5;
					eval(mcName)._y = 555;
				} else {
					if (i < 24) {
					mcX = mcX+20;
					eval(mcName)._x = mcX;
					eval(mcName)._y = 535;					
				} else {
				if (i > 24) {
					mcX = mcX+20;
					eval(mcName)._x = mcX;
					eval(mcName)._y = 555;
				} } } }
			}
			eval(mcName).SlideNum._visible = false;
		}
	}
}

function doPlayPreviousMovie() {
	_root.doStopSpanishAudio();
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
	_root.Mc_Formulas._visible = false;
	_root.m_c._visible = false;
	_root.popup.gotoAndStop(1);
	_root.next_mc.gotoAndStop("inactive");
	_root.replay_mc.gotoAndStop("inactive");

	if (_global.slideNumber<2) {
		_global.sectionNumber--;		
		if (_global.sectionNumber <= 0) {
			_global.sectionNumber = 0;
			_global.slideNumber = 2;
			newTempSpl = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");
			_global.playSwfFileName=_global.MainFilePath+newTempSpl[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();			
			_root.loadSWFMovie();			
		} else {
			newTempSpl = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");
			_global.slideNumber = newTempSpl.length-1;
			_global.playSwfFileName=_global.MainFilePath+newTempSpl[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();			
			_root.loadSWFMovie();		
		
		}

	} else {
		newTempSpl = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");
		_global.playSwfFileName=_global.MainFilePath+newTempSpl[_global.slideNumber];
		_root.doPutBackAndFinished();			
		_root.loadSWFMovie();
	
	}

}

function doPlayNextMovie() {
	if(_global.newTitleTag==true) {
		splTempChkName = _global.playSwfFileName.substring(0, _global.playSwfFileName.length-4).split('/');
		tempCheckValue = splTempChkName[splTempChkName.length-5]+","+splTempChkName[splTempChkName.length-4]+","+splTempChkName[splTempChkName.length-3]+","+splTempChkName[splTempChkName.length-2]+","+splTempChkName[splTempChkName.length-1];
		if (_global.sectionNumber<_global.arrayTotalSectionDetails.length-1) {
			_root.doStopSpanishAudio();
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
			_root.Mc_Formulas._visible = false;
			_root.m_c._visible = false;
			_root.popup.gotoAndStop(1);
			_root.next.gotoAndStop("inactive");
			_root.replay.gotoAndStop("inactive");
			
			newTempSpl = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");
			if (_global.slideNumber>newTempSpl.length-1) {
				_global.sectionNumber++;		
				if (_global.sectionNumber>=_global.arrayTotalSectionDetails.length) {
					_global.sectionNumber = _global.arrayTotalSectionDetails.length-1;
					newTempSpl = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");
					_global.slideNumber = newTempSpl.length-1;
					_global.playSwfFileName=_global.MainFilePath+newTempSpl[_global.slideNumber];
					_root.doCreateSlide();
					_root.doPutBackAndFinished();			
					_root.loadSWFMovie();			
				} else {
					newTempSpl = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");
					_global.slideNumber = 2;
					_global.playSwfFileName=_global.MainFilePath+newTempSpl[_global.slideNumber];
					_root.doCreateSlide();
					_root.doPutBackAndFinished();			
					_root.loadSWFMovie();		

				}

			} else {
				newTempSpl = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");
				_global.playSwfFileName=_global.MainFilePath+newTempSpl[_global.slideNumber];
				_root.doPutBackAndFinished();			
				_root.loadSWFMovie();

			}			
		} else {
			if (tempCheckValue == _global.tempLastSlideName) {
				_root.Mc_LC.gotoAndStop(2);
			} else {
				_root.doStopSpanishAudio();
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
				_root.Mc_Formulas._visible = false;
				_root.m_c._visible = false;
				_root.popup.gotoAndStop(1);
				_root.next.gotoAndStop("inactive");
				_root.replay.gotoAndStop("inactive");

				newTempSpl = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");
				if (_global.slideNumber>newTempSpl.length-1) {
					_global.sectionNumber++;		
					if (_global.sectionNumber>=_global.arrayTotalSectionDetails.length) {
						_global.sectionNumber = _global.arrayTotalSectionDetails.length-1;
						newTempSpl = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");
						_global.slideNumber = newTempSpl.length-1;
						_global.playSwfFileName=_global.MainFilePath+newTempSpl[_global.slideNumber];
						_root.doCreateSlide();
						_root.doPutBackAndFinished();			
						_root.loadSWFMovie();			
					} else {
						newTempSpl = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");
						_global.slideNumber = 2;
						_global.playSwfFileName=_global.MainFilePath+newTempSpl[_global.slideNumber];
						_root.doCreateSlide();
						_root.doPutBackAndFinished();			
						_root.loadSWFMovie();		

					}

				} else {
					newTempSpl = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");
					_global.playSwfFileName=_global.MainFilePath+newTempSpl[_global.slideNumber];
					_root.doPutBackAndFinished();			
					_root.loadSWFMovie();

				}			
			}
		}
	} else {
		_root.doStopSpanishAudio();
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
		_root.Mc_Formulas._visible = false;
		_root.m_c._visible = false;
		_root.popup.gotoAndStop(1);
		_root.next.gotoAndStop("inactive");
		_root.replay.gotoAndStop("inactive");
		
		newTempSpl = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");
		if (_global.slideNumber>newTempSpl.length-1) {
			_global.sectionNumber++;		
			if (_global.sectionNumber>=_global.arrayTotalSectionDetails.length) {
				_global.sectionNumber = _global.arrayTotalSectionDetails.length-1;
				newTempSpl = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");
				_global.slideNumber = newTempSpl.length-1;
				_global.playSwfFileName=_global.MainFilePath+newTempSpl[_global.slideNumber];
				_root.doCreateSlide();
				_root.doPutBackAndFinished();			
				_root.loadSWFMovie();			
			} else {
				newTempSpl = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");
				_global.slideNumber = 2;
				_global.playSwfFileName=_global.MainFilePath+newTempSpl[_global.slideNumber];
				_root.doCreateSlide();
				_root.doPutBackAndFinished();			
				_root.loadSWFMovie();		

			}

		} else {
			newTempSpl = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");
			_global.playSwfFileName=_global.MainFilePath+newTempSpl[_global.slideNumber];
			_root.doPutBackAndFinished();			
			_root.loadSWFMovie();

		}
	}
}

function loadSWFMovie() {
	_root.preLoading=false;
	_root.SA._visible = false;
	_root.EA._visible = false;
	
	_root.SA_PLAY._visible=false;
	_root.SA_PAUSE._visible=false;	

	_global.quizSection=false;
	_root.doStopSpanishAudio();
	_global.showLoading_Spanish = false;
	
	_global.showWarnText = 1;
	_root.animation_mc.unloadMovie();
	_root.txtWarnText.text = "Loading page. Please wait...";
	_root.txtWarnText._visible=true;
	ss = new Sound();
	ss.setVolume(_global.VolLevel);
	_global.startTime = getTimer();
	
	splitRootURL = _global.playSwfFileName.split("/");
	splitFileName = splitRootURL[splitRootURL.length-1].split("FQ");
	strTempLID = splitFileName[0];
		
	for (i=0;i<splitRootURL.length;i++) {
		if (splitRootURL.indexOf("FQ02")!=-1) {
			strTempURL = splitRootURL(i);
		}
	}	

	if (_global.playSwfFileName.indexOf("FQ01")!=-1) {
		NavigationButtonsONOFF = _root.SectionNavigationONOFF[0];
	} else {
	if (_global.playSwfFileName.indexOf("FQ02")!=-1) {
		NavigationButtonsONOFF = _root.SectionNavigationONOFF[1];
	} else {
	if (_global.playSwfFileName.indexOf("FQ03")!=-1) {
		NavigationButtonsONOFF = _root.SectionNavigationONOFF[2];		
	} } }
	
	

	if (NavigationButtonsONOFF.toUpperCase()=="OFF") {
		if (_root.dtfCALCQUIZ.text.toLowerCase()=="on") {
			_root.calculator_but._visible=true;
		} else {
			_root.calculator_but._visible=false;
		}
        if (_root.dtfFormulasInQuiz.text.toLowerCase()=="on") {
            _root.Btn_Formulas._visible=true;
        } else {
            _root.Btn_Formulas._visible=false;
        }
        if (_root.dtfNotepadInQuiz.text.toLowerCase()=="on") {
            _root.Btn_Notepad._visible=true;
        } else {
            _root.Btn_Notepad._visible=false;
        }
        if (_root.dtfWallInQuiz.text.toLowerCase()=="on") {
            _root.Btn_Thewall._visible=true;
        } else {
            _root.Btn_Thewall._visible=false;
        }        

       	//Begin JSFlashCommunication
        	//doRemoveSquare();
        	var arrJSFSplFirst, arrJSFSplSecond, arrJSFSplThird, strJSFVar, strJSFVarFinalFirst, strJSFVarFinalSecond, strJSFVarFinalThird;
        	strJSFVar = "";
        	strJSFVarFinalFirst = "";
        	strJSFVarFinalSecond = "";
        	strJSFVarFinalThird = "";
        	
        	arrJSFSplFirst = _root.XML_URL.split("HELP_COURSES/");
        	arrJSFSplSecond = arrJSFSplFirst[1].split("/index");
        	arrJSFSplThird = arrJSFSplSecond[0].split("/");
        	for (i=0; i<arrJSFSplThird.length; i++) {
        		if (strJSFVar=="") {
        			strJSFVar = arrJSFSplThird[i];
        		} else {
        			strJSFVar = strJSFVar + "," + arrJSFSplThird[i];
        		}
        	}
        	strJSFVarFinalFirst = "HELP_COURSES," + strJSFVar + ",FQ," + strTempLID+"FQ01";
        	strJSFVarFinalSecond = "HELP_COURSES," + strJSFVar + ",FQ," + strTempLID+"FQ02";
        	strJSFVarFinalThird = "HELP_COURSES," + strJSFVar + ",FQ," + strTempLID+"FQ03";
        
        	_root[strJSFVarFinalFirst]._visible=false;
        	_root[strJSFVarFinalSecond]._visible=false;
        	_root[strJSFVarFinalThird]._visible=false;
       	//End JSFlashCommunication
		
		_root.main_back._visible=false;
		_root.map._visible=false;
		_root.keyterms_but._visible=false;
		_root.back_mc1._visible=false;
		_root.next_mc._visible=false;
		_root.BtnRewind._visible=false;
		_root.BtnForward._visible=false;
		_root.replay_mc._visible=false;
		_root.audiomain._visible=false;
		_root.pause_mc._visible=false;
		_root.play_mc._visible=false;
		_root.mySlider._visible=false;
		_root.Progress_Bar._visible=false;
		_root.FillColor._visible=false;	

		_root[strTempLID+"FQ01"]._visible=false;
		_root[strTempLID+"FQ02"]._visible=false;
		_root[strTempLID+"FQ03"]._visible=false;


	} else {
		if (_root.dtfCALCLESSON.text.toLowerCase()=="on") {
			_root.calculator_but._visible=true;
		} else {
			_root.calculator_but._visible=false;
		}
        if (_root.dtfFormulasInLesson.text.toLowerCase()=="off") {
            _root.Btn_Formulas._visible=false;
        } else {
            _root.Btn_Formulas._visible=true;
        }
        if (_root.dtfNotepadInLesson.text.toLowerCase()=="off") {
            _root.Btn_Notepad._visible=false;
        } else {
            _root.Btn_Notepad._visible=true;
        }
        if (_root.dtfWallInLesson.text.toLowerCase()=="off") {
            _root.Btn_Thewall._visible=false;
        } else {
            _root.Btn_Thewall._visible=true;
        }  
		_root.main_back._visible=true;
		_root.map._visible=true;
		_root.keyterms_but._visible=true;
		_root.back_mc1._visible=true;
		_root.next_mc._visible=true;
		_root.BtnRewind._visible=true;
		_root.BtnForward._visible=true;
		_root.replay_mc._visible=true;
		_root.audiomain._visible=true;
		_root.pause_mc._visible=true;
		_root.play_mc._visible=true;
		_root.mySlider._visible=true;
		_root.Progress_Bar._visible=true;
		_root.FillColor._visible=true;		

	}
	
	if (_root.dtfNoMap.text.toUpperCase()=="YES") {
		_root.map._visible=false;
	}
	if (_global.playSwfFileName.indexOf("FQ02")!=-1) {
		if (_root.dtfKeyTermsTabInQuiz.text.toLowerCase()=="on") {
			_root.keyterms_but._visible = true;

		} else {
			_root.keyterms_but._visible = false;
		}
	} else {
		if (_root.dtfKeyTermsTabInLesson.text.toLowerCase()=="off") {
			_root.keyterms_but._visible = false;

		} else {
			_root.keyterms_but._visible = true;
		}	
	}

	_global.gSound.stop();
	//_root.doCheckRndAudio();
	_root.doCheckBGText();

//LMS BEGIN

	if(_global.newTitleTag==true) {
		tempNewSpl = _root.arraySectionDetails[_global.sectionNumber].split("~");
		_global.Section = tempNewSpl[tempNewSpl.length-1];
	} else {
		for (i=0; i<_root.arrSectionReportVars.length; i++) {
			if (_global.sectionNumber==_root.arrSectionReportVars[i].SectionNumber) {
				_global.Section = _root.arrSectionReportVars[i].SectionName;
				break;
			}
		}
	
		/*
		if (_global.sectionNumber==0) {
			_global.Section = "Introduction";
		}
		if (_global.sectionNumber==1) {
			_global.Section = "Real World";
			_root.dtfSECTION1.text  = _global.Section;
		}
		if (_global.sectionNumber==2) {
			_global.Section = "Vocabulary";
			_root.dtfSECTION2.text  = _global.Section;
		}
		if (_global.sectionNumber==3) {
			_global.Section = "Instruction";
			_root.dtfSECTION3.text  = _global.Section;	
		}
		if (_global.sectionNumber==4) {
			_global.Section = "Try It";
			_root.dtfSECTION4.text  = _global.Section;	
		}
		if (_global.sectionNumber==5) {
			_global.Section = "Games";
			_root.dtfSECTION5.text  = _global.Section;	
		}
		if (_global.sectionNumber==6) {
			_global.Section = "Test and Skills";
			_root.dtfSECTION6.text  = _global.Section;	
		}
		if (_global.sectionNumber==7) {
			_global.Section = "Final Quiz";
			_root.dtfSECTION7.text  = _global.Section;
		}*/
	}
//LMS END

	_global.updatedata = 1;
	_global.FileName = _global.playSwfFileName;
	
	_global.timeOutValue = parseInt(dtfFileDownload_TimeOut.text);
	_global.triesValue = parseInt(dtfFileDownload_Tries.text);
	if (dtfFileDownload_TimeOut.text == "" || dtfFileDownload_TimeOut.text == "undefined" || dtfFileDownload_TimeOut.text == undefined) {
		_global.timeOutValue = 10;
	}
	if (dtfFileDownload_Tries.text == "" || dtfFileDownload_Tries.text == "undefined" || dtfFileDownload_Tries.text == undefined) {
		_global.triesValue = 5;
	}
	
	_global.ErrorCode = "OK:";
	_root.Mc_Data_Update.gotoAndStop(15);
	_root.animation_mc.loadMovie(_global.playSwfFileName, 1);
	
	_root.animation_mc_preload.unloadMovie();
	newTempSpl = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");
	if (_global.slideNumber+1>=newTempSpl.length) {
		if (_global.sectionNumber+1<_global.arrayTotalSectionDetails.length) {
			newTempSpl = _global.arrayTotalSectionDetails[_global.sectionNumber+1].split("~");
			_global.playSwfFileName_Preload = _global.MainFilePath+newTempSpl[2];
			_root.chkSlideNumber = 2;
		}
	} else {
		_global.playSwfFileName_Preload = _global.MainFilePath+newTempSpl[_global.slideNumber+1];
		_root.chkSlideNumber = _global.slideNumber+1;
	}
	//_root.Temp3 = _global.playSwfFileName_Preload;
	
    //Final Quiz Intro Audio Begin
    if (_global.playSwfFileName.indexOf("FQ01")!=-1) {
    	strFQIntroAudio = "FQ_Intro_" + (random(5)+1);
    	sndFQIntro = new Sound();
    	sndFQIntro.attachSound(strFQIntroAudio);
    	sndFQIntro.start();
    	sndFQIntro.setVolume(_global.VolLevel);
    }
    //Final Quiz Intro Audio End	
	
}

//Final Quiz Audio ON OFF Functions Begin
function doPlayFQAudio(strPlayPauseMc) {
	eval(strPlayPauseMc).gotoAndStop(2);
	_global.sndFQSound.start();
}
function doPauseFQAudio(strPlayPauseMc) {
	eval(strPlayPauseMc).gotoAndStop(1);
	_global.sndFQSound.stop();
}
function doPlayFQQuestionAudio(strFQMc, strLNG) {
	_global.sndFQSound.stop();
	_global.sndFQSound.unLoad();
	if (eval(strFQMc).Mc_PlayPause_Audio._currentframe==2) {
		if (_global.strLNG==strLNG) {
			eval(strFQMc).Mc_PlayPause_Audio.gotoAndStop(1);
			_global.sndFQSound.stop();
			_global.sndFQSound.unLoad();
		} else {
			_root.animation_mc.animation.Mc_Quiz_Audio.Mc_PlayPause_Audio.gotoAndStop(1);
			for (i=1; i<=4; i++) {
				eval("_root.animation_mc.animation.Mc_Quiz_Audio_" + i).Mc_PlayPause_Audio.gotoAndStop(1);
			}

			strFQTempLabel = "Q" + Number(_root.animation_mc.animation._currentframe-1).toString();
			_global.strFQTempLabel = strFQTempLabel;
			splitRootFQQuestionAudioURL = _global.playSwfFileName.split("/");
			strFQQuestionAudioURL = "";
			for (i=0;i<splitRootFQQuestionAudioURL.length-1;i++) {
				if (strFQQuestionAudioURL=="") {
					strFQQuestionAudioURL = splitRootFQQuestionAudioURL[i];
				} else {
					strFQQuestionAudioURL = strFQQuestionAudioURL + "/" + splitRootFQQuestionAudioURL[i];
				}
			}
			switch (strLNG) {
				case "EN":
					strFQQuestionAudioURL = strFQQuestionAudioURL + "/EA/" + strFQTempLabel + ".mp3";
					break;
				case "SP":
					strFQQuestionAudioURL = strFQQuestionAudioURL + "/SA/" + strFQTempLabel + ".mp3";
					break;
			}
			_global.sndFQSound = new Sound();
			_global.sndFQSound.onLoad = function(success) {
				if (success) {
					_global.sndFQSound.start(0);
					eval(strFQMc).Mc_PlayPause_Audio.gotoAndStop(2);
				} else {

				}
			}
			_global.sndFQSound.loadSound(strFQQuestionAudioURL,false);
			_global.sndFQSound.onSoundComplete = function() {
				eval(strFQMc).Mc_PlayPause_Audio.gotoAndStop(1);
				_global.sndFQSound.stop();
				_global.sndFQSound.unLoad();
			};
			_global.strLNG=strLNG;
		}
	} else {
		_root.animation_mc.animation.Mc_Quiz_Audio.Mc_PlayPause_Audio.gotoAndStop(1);
		for (i=1; i<=4; i++) {
			eval("_root.animation_mc.animation.Mc_Quiz_Audio_" + i).Mc_PlayPause_Audio.gotoAndStop(1);
		}

		strFQTempLabel = "Q" + Number(_root.animation_mc.animation._currentframe-1).toString();
		_global.strFQTempLabel = strFQTempLabel;
		splitRootFQQuestionAudioURL = _global.playSwfFileName.split("/");
		strFQQuestionAudioURL = "";
		for (i=0;i<splitRootFQQuestionAudioURL.length-1;i++) {
			if (strFQQuestionAudioURL=="") {
				strFQQuestionAudioURL = splitRootFQQuestionAudioURL[i];
			} else {
				strFQQuestionAudioURL = strFQQuestionAudioURL + "/" + splitRootFQQuestionAudioURL[i];
			}
		}
		switch (strLNG) {
			case "EN":
				strFQQuestionAudioURL = strFQQuestionAudioURL + "/EA/" + strFQTempLabel + ".mp3";
				break;
			case "SP":
				strFQQuestionAudioURL = strFQQuestionAudioURL + "/SA/" + strFQTempLabel + ".mp3";
				break;
		}
		_global.sndFQSound = new Sound();
		_global.sndFQSound.onLoad = function(success) {
			if (success) {
				_global.sndFQSound.start(0);
				eval(strFQMc).Mc_PlayPause_Audio.gotoAndStop(2);
			} else {

			}
		}
		_global.sndFQSound.loadSound(strFQQuestionAudioURL,false);
		_global.sndFQSound.onSoundComplete = function() {
			eval(strFQMc).Mc_PlayPause_Audio.gotoAndStop(1);
			_global.sndFQSound.stop();
			_global.sndFQSound.unLoad();
		};
		_global.strLNG=strLNG;
	}

	//Begin Click Project Individual for MLC
		if (_root.dtfLESSON.text=="50" || _root.dtfLESSON.text=="54" || _root.dtfLESSON.text=="61" || _root.dtfLESSON.text=="64" || _root.dtfLESSON.text=="66" || _root.dtfLESSON.text=="74" || _root.dtfLESSON.text=="63" || _root.dtfLESSON.text=="68" || _root.dtfLESSON.text=="76" || _root.dtfLESSON.text=="77" || _root.dtfLESSON.text=="53" || _root.dtfLESSON.text=="65" || _root.dtfLESSON.text=="70" || _root.dtfLESSON.text=="72"  || _root.dtfLESSON.text=="60" || _root.dtfLESSON.text=="62" || _root.dtfLESSON.text=="73" || _root.dtfLESSON.text=="58" || _root.dtfLESSON.text=="71") {
			boolFQClickRecord = true;
		}
		if (boolFQClickRecord && _root.dtfClicks.text.toUpperCase()=="ON" && _root.boolMcVisible==false) {
			if (eval(strFQMc).Mc_PlayPause_Audio._currentframe==1) {
				switch (strLNG) {
					case "EN":
						_root.strIndividualButttonClickType = "ENFQQUES";
						break;
					case "SP":
						_root.strIndividualButttonClickType = "SPFQQUES";
						break;
				}
				strTempIndividualClickDesc = _global.strFQTempLabel;
				strTempIndividualClickDesc = strTempIndividualClickDesc.split("&").join("ANDSYM");			
				_root.strIndividualClickDesc = strTempIndividualClickDesc;
				_root.strFinalClickURL = "";
				_root.Send_Click_Report_Mc.gotoAndPlay(6);
			}
		}
	//End Click Project Individual for MLC
}

function doPlayFQAnswerAudio(strFQMc, strLNG) {
	_global.sndFQSound.stop();
	_global.sndFQSound.unLoad();
	if (eval(strFQMc).Mc_PlayPause_Audio._currentframe==2) {
		if (_global.strLNG==strLNG) {
			eval(strFQMc).Mc_PlayPause_Audio.gotoAndStop(1);
			_global.sndFQSound.stop();
			_global.sndFQSound.unLoad();
		} else {
			_root.animation_mc.animation.Mc_Quiz_Audio.Mc_PlayPause_Audio.gotoAndStop(1);
			for (i=1; i<=4; i++) {
				eval("_root.animation_mc.animation.Mc_Quiz_Audio_" + i).Mc_PlayPause_Audio.gotoAndStop(1);
			}


			strFQTempLabel = "Q" + Number(_root.animation_mc.animation._currentframe-1).toString();
			_global.strFQTempLabel = strFQTempLabel;
			splitRootFQAnswerAudioURL = _global.playSwfFileName.split("/");
			strFQAnswerAudioURL = "";
			for (i=0;i<splitRootFQAnswerAudioURL.length-1;i++) {
				if (strFQAnswerAudioURL=="") {
					strFQAnswerAudioURL = splitRootFQAnswerAudioURL[i];
				} else {
					strFQAnswerAudioURL = strFQAnswerAudioURL + "/" + splitRootFQAnswerAudioURL[i];
				}
			}

			var strQALabel:String = "";
			var intOptID:Number = 0;
			var strTempQAName:String = "";
			strTempQAName = eval(strFQMc)._name;
			strQAFName = "";
			intOptID = Number(strTempQAName.substring(strTempQAName.length-1, strTempQAName.length));
			switch (intOptID) {
				case 1:
					strQALabel = "A";
					break;
				case 2:
					strQALabel = "B";
					break;
				case 3:
					strQALabel = "C";
					break;
				case 4:
					strQALabel = "D";
					break;

			}
			strQAFName = strFQTempLabel + strQALabel + ".mp3";
			switch (strLNG) {
				case "EN":
					strFQAnswerAudioURL = strFQAnswerAudioURL + "/EA/" + strQAFName;
					break;
				case "SP":
					strFQAnswerAudioURL = strFQAnswerAudioURL + "/SA/" + strQAFName;
					break;
			}
			_global.sndFQSound = new Sound();
			_global.sndFQSound.onLoad = function(success) {
				if (success) {
					_global.sndFQSound.start(0);
					eval(strFQMc).Mc_PlayPause_Audio.gotoAndStop(2);
				} else {

				}
			}
			_global.sndFQSound.loadSound(strFQAnswerAudioURL,false);
			_global.sndFQSound.onSoundComplete = function() {
				eval(strFQMc).Mc_PlayPause_Audio.gotoAndStop(1);
				_global.sndFQSound.stop();
				_global.sndFQSound.unLoad();
			};
			_global.strLNG=strLNG;
		}
	} else {
		_root.animation_mc.animation.Mc_Quiz_Audio.Mc_PlayPause_Audio.gotoAndStop(1);
		for (i=1; i<=4; i++) {
			eval("_root.animation_mc.animation.Mc_Quiz_Audio_" + i).Mc_PlayPause_Audio.gotoAndStop(1);
		}


		strFQTempLabel = "Q" + Number(_root.animation_mc.animation._currentframe-1).toString();
		_global.strFQTempLabel = strFQTempLabel;
		splitRootFQAnswerAudioURL = _global.playSwfFileName.split("/");
		strFQAnswerAudioURL = "";
		for (i=0;i<splitRootFQAnswerAudioURL.length-1;i++) {
			if (strFQAnswerAudioURL=="") {
				strFQAnswerAudioURL = splitRootFQAnswerAudioURL[i];
			} else {
				strFQAnswerAudioURL = strFQAnswerAudioURL + "/" + splitRootFQAnswerAudioURL[i];
			}
		}

		var strQALabel:String = "";
		var intOptID:Number = 0;
		var strTempQAName:String = "";
		strTempQAName = eval(strFQMc)._name;
		strQAFName = "";
		intOptID = Number(strTempQAName.substring(strTempQAName.length-1, strTempQAName.length));
		switch (intOptID) {
			case 1:
				strQALabel = "A";
				break;
			case 2:
				strQALabel = "B";
				break;
			case 3:
				strQALabel = "C";
				break;
			case 4:
				strQALabel = "D";
				break;

		}
		strQAFName = strFQTempLabel + strQALabel + ".mp3";
		switch (strLNG) {
			case "EN":
				strFQAnswerAudioURL = strFQAnswerAudioURL + "/EA/" + strQAFName;
				break;
			case "SP":
				strFQAnswerAudioURL = strFQAnswerAudioURL + "/SA/" + strQAFName;
				break;
		}
		_global.sndFQSound = new Sound();
		_global.sndFQSound.onLoad = function(success) {
			if (success) {
				_global.sndFQSound.start(0);
				eval(strFQMc).Mc_PlayPause_Audio.gotoAndStop(2);
			} else {

			}
		}
		_global.sndFQSound.loadSound(strFQAnswerAudioURL,false);
		_global.sndFQSound.onSoundComplete = function() {
			eval(strFQMc).Mc_PlayPause_Audio.gotoAndStop(1);
			_global.sndFQSound.stop();
			_global.sndFQSound.unLoad();
		};
		_global.strLNG=strLNG;
	}

	//Begin Click Project Individual for MLC
		if (_root.dtfLESSON.text=="50" || _root.dtfLESSON.text=="54" || _root.dtfLESSON.text=="61" || _root.dtfLESSON.text=="64" || _root.dtfLESSON.text=="66" || _root.dtfLESSON.text=="74" || _root.dtfLESSON.text=="63" || _root.dtfLESSON.text=="68" || _root.dtfLESSON.text=="76" || _root.dtfLESSON.text=="77" || _root.dtfLESSON.text=="53" || _root.dtfLESSON.text=="65" || _root.dtfLESSON.text=="70" || _root.dtfLESSON.text=="72"  || _root.dtfLESSON.text=="60" || _root.dtfLESSON.text=="62" || _root.dtfLESSON.text=="73" || _root.dtfLESSON.text=="58" || _root.dtfLESSON.text=="71") {
			boolFQClickRecord = true;
		}	
		if (boolFQClickRecord && _root.dtfClicks.text.toUpperCase()=="ON" && _root.boolMcVisible==false) {
			if (eval(strFQMc).Mc_PlayPause_Audio._currentframe==1) {
				switch (strLNG) {
					case "EN":
						_root.strIndividualButttonClickType = "ENFQANS";
						break;
					case "SP":
						_root.strIndividualButttonClickType = "SPFQANS";
						break;
				}
				strTempIndividualClickDesc = _global.strFQTempLabel + "Option" + strQALabel;
				strTempIndividualClickDesc = strTempIndividualClickDesc.split("&").join("ANDSYM");			
				_root.strIndividualClickDesc = strTempIndividualClickDesc;
				_root.strFinalClickURL = "";
				_root.Send_Click_Report_Mc.gotoAndPlay(6);
			}
		}
	//End Click Project Individual for MLC
}
//Final Quiz Audio ON OFF Functions End

function setSpanishPopUp(mcTarget,frameLbl) {
	startDrag(mcTarget, true);
	tellTarget (mcTarget) {
		eval(mcTarget).gotoAndPlay(frameLbl);
	}

}

function unSetSpanishPopUp(mcTarget,frameLbl) {
	eval(mcTarget).gotoAndStop(frameLbl);

}

function loadAnimationPage(splitStart, splitEnd, mcPageName) {
	_global.splitStart = splitStart;
	_global.splitEnd = splitEnd;

	stopDrag();
	_root.mover_mc.gotoAndStop("inactive");

	_global.Play = true;
	_global.Pause = false;
	_global.CompClick = "";
	_root.doGetSwfFileName(mcPageName);
	_root.doCreateSlide();
	_root.doPutBackAndFinished();
	_root.loadSWFMovie();
	_root.popup.gotoAndStop(1);
	_root.map.enabled = true;
	_root.m1_l1.gotoAndStop("map");
}	

function showWrongFeed() {
	intMc_Name = random(3);
	intMc_Name = intMc_Name+1;
	eval("_root.animation_mc.animation.Mc_Wrong_Feed"+intMc_Name)._visible = true;
	eval("_root.animation_mc.animation.Mc_Wrong_Feed"+intMc_Name).gotoAndPlay(2);
	eval("_root.animation_mc.animation.Mc_Wrong_Feed"+intMc_Name)._x = 5;
	_global.gSound.setVolume(_global.volLevel);
}

function showRightFeed() {
	intMc_Name = random(4);
	intMc_Name = intMc_Name+1;
	eval("_root.animation_mc.animation.Mc_Right_Feed"+intMc_Name)._visible = true;
	eval("_root.animation_mc.animation.Mc_Right_Feed"+intMc_Name).gotoAndPlay(2);
	eval("_root.animation_mc.animation.Mc_Right_Feed"+intMc_Name)._x = 5;
	_global.gSound.setVolume(_global.volLevel);
}

function disableQuizButton() {
	for (i=1; i<=25; i++) {
		eval("_root.animation_mc.animation.AnsBtn"+i).enabled = false;
		eval("_root.animation_mc.animation.AnsBtn"+i)._visible = false;
		eval("_root.animation_mc.animation.AnsBtn"+i)._visible = false;
	}
	_root.animation_mc.animation.NMHBtn.enabled = false;
}

function enableQuizButton() {
	for (i=1; i<=25; i++) {
		eval("_root.animation_mc.animation.AnsBtn"+i).enabled = true;
		eval("_root.animation_mc.animation.AnsBtn"+i)._visible = true;
	}
	_root.animation_mc.animation.NMHBtn.enabled = true;
	
}

function doMapClickEnableAll() {
	if (_root.animation_mc.animation.notepad_mc._currentframe!=2) {
		_global.Play = true;
		_global.Pause = false;
		_global.CompClick = "";
	}
	_root.animation_mc.animation.notepad_mc.DesEng.type="input";
	_root.animation_mc.animation.notepad_mc.DesEng.selectable=true;
	_root.animation_mc.animation.notepad_mc.BtnClose.enabled=true;
	_root.animation_mc.animation.notepad_mc.BtnPrint.enabled=true;
	
	_root.m1_l1.gotoAndStop("m1_l1_content");
	_root.m1_l1._visible = false;
	_global.needMoreBackURL = "";
}

function doNeedMoreHelp(strScrName,framePlay,tempSection) {
	_global.quizSection = false;
	//_global.sectionNumber = tempSection-1;
	tempArrGetSwf = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");	
	
	for (i=2;i<tempArrGetSwf.length;i++) {
		splTempChkName = tempArrGetSwf[i].substring(0, tempArrGetSwf[i].length-4).split('/');
		mcName = splTempChkName[splTempChkName.length-1]	
		if (mcName==strScrName) {
			_global.slideNumber = i;
			_global.playSwfFileName = _global.MainFilePath+tempArrGetSwf[i];
			//_root.Temp = _global.playSwfFileName;
		}
	}
	_root.doCreateSlide();
	_root.loadSWFMovie();
}

function doCheckPrevAndNext() {
	//Begin Page Need More Help ONOFF
		//if (_root.dtfNMHLesson.text.toUpperCase()=="OFF" && (_global.section=="Instruction" || _global.section=="Try It")) {
		if (_root.dtfNMHLesson.text.toUpperCase()=="OFF") {
			_root.animation_mc.animation.NMHBtn._visible = false;
		} else {
			_root.animation_mc.animation.NMHBtn._visible = true;
		}
	//End Page Need More Help ONOFF
	
	splitRootURL = _global.playSwfFileName.split("/");
	splitFileName = splitRootURL[splitRootURL.length-1].split("FQ");
	strTempLID = splitFileName[0];

	for (i=0;i<splitRootURL.length;i++) {
		if (splitRootURL.indexOf("FQ02")!=-1) {
			strTempURL = splitRootURL(i);
		}
	}
		
	if (_global.playSwfFileName.indexOf("FQ01")!=-1) {
		NavigationButtonsONOFF = _root.SectionNavigationONOFF[0];
	} else {
	if (_global.playSwfFileName.indexOf("FQ02")!=-1) {
		NavigationButtonsONOFF = _root.SectionNavigationONOFF[1];
	} else {
	if (_global.playSwfFileName.indexOf("FQ03")!=-1) {
		NavigationButtonsONOFF = _root.SectionNavigationONOFF[2];		
	} } }

	if (NavigationButtonsONOFF.toUpperCase()=="OFF") {
		_root[strTempLID+"FQ01"]._visible=false;
		_root[strTempLID+"FQ02"]._visible=false;
		_root[strTempLID+"FQ03"]._visible=false;
	}
	
	
	if (_global.playSwfFileName.indexOf("FQ02")==-1 && _global.playSwfFileName.indexOf("FQ03")==-1) {	
		ss = new Sound();
		ss.setVolume(_global.volLevel);
		if (_root.InternalPreloader._currentframe == 1 && _root.animation_mc.animation._currentframe>1 && _root.animation_mc.animation._currentframe>=_root.animation_mc.animation._totalframes) {
			if (_root.nextani._currentframe == 1) {
				_root.nextani.gotoAndPlay("nextani");
			}
		} else {
			_root.nextani.gotoAndStop(1);

		}
		_root.doCheckSpanishAudio();
		_root.BtnRewind.enabled=true;
		_root.BtnForward.enabled=true;

		if (_root.animation_mc.animation._currentframe<=1) {
			_root.BtnRewind.enabled=false;
			_root.BtnForward.enabled=true;
			_global.rewind = 0;
			_root.pause_mc._visible = false;
			_root.play_mc._visible = true;		
		}
		if (_root.animation_mc.animation._currentframe>=_root.animation_mc.animation._totalframes) {
			_root.BtnRewind.enabled=true;
			_root.BtnForward.enabled=false;
			_global.forward=0;
			_root.pause_mc._visible = false;
			_root.play_mc._visible = true;		
		}


		if (_root.animation_mc.animation._currentframe>1 && _root.animation_mc.animation._currentframe>=_root.animation_mc.animation._totalframes) {
			_root.animation_mc.animation.stop();
			if (_global.randomAudio == true) {
				_global.gSound.setVolume(0);
			}
			_root.animation_mc.animation.s_aud1.gotoAndStop(1);
			_root.pause_mc._visible = false;
			_root.play_mc._visible = false;
			if (_global.Play == true && _global.CompClick == "") {
				_root.m_c._visible = false;
				_root.glossary._visible = false;
				_root.calculator._visible = false;
				_root.Mc_Formulas._visible = false;
				_root.m1_l1.gotoAndStop("m1_l1_content");
				_root.m1_l1._visible = false;
			}
		} else {
			if (_root.animation_mc.animation._currentframe>=1 && _root.animation_mc.animation._currentframe<_root.animation_mc.animation._totalframes) {
				if (_global.needMoreBackURL != "") {
					_root.animation_mc.animation.TestBack._alpha = 100;
					_root.animation_mc.animation.TestBack._visible = true;
				} else {
					_root.animation_mc.animation.TestBack._alpha = 0;
					_root.animation_mc.animation.TestBack._visible = false;
				}
				_root.nextani.gotoAndStop(1);
				if (_global.Play == true && _global.CompClick == "" && _global.quizSection == false) {
					//_root.popup.gotoAndStop(1);
					_root.mover_mc.gotoAndStop("inactive");
					_root.nextani.gotoAndStop(1);
					_root.glossary._visible = false;
					_root.m_c._visible = false;
					_root.calculator._visible = false;
					_root.Mc_Formulas._visible = false;
					_root.m1_l1.gotoAndStop("m1_l1_content");
					_root.m1_l1._visible = false;
					_root.replay_mc.gotoAndStop("inactive");
					if (_global.playSwfFileName.indexOf("FQ")==-1) {
						_root.pause_mc._visible = true;
						_root.play_mc._visible = false;
					}
					if (_root.animation_mc.animation._currentframe == _global.CurPlayFrame) {
						_root.animation_mc.animation.play();
					}
					_root.animation_mc.animation.s_aud1.gotoAndStop(1);
					for (i=1; i<=4; i++) {
						eval("_root.animation_mc.animation.Mc_Feed"+i).gotoAndStop(1);
						eval("_root.animation_mc.animation.Mc_Feed"+i)._visible = false;
						eval("_root.animation_mc.animation.Mc_Right_Feed"+i).gotoAndStop(1);
						eval("_root.animation_mc.animation.Mc_Right_Feed"+i)._visible = false;
						eval("_root.animation_mc.animation.Mc_Wrong_Feed"+i).gotoAndStop(1);
						eval("_root.animation_mc.animation.Mc_Wrong_Feed"+i)._visible = false;
					}
					if (_global.Mute == false) {
						_global.gSound.setVolume(_global.volLevel);
						_global.spanSoundMp3.setVolume(_global.volLevel);
						_root.mySlider.enabled=true;
						_root.mySlider.dragger.enabled=true;
						_root.mySlider.Btn_Click.enabled=true;						
						
						
					} else {
						_global.gSound.setVolume(0);
						_global.spanSoundMp3.setVolume(0);
						_root.mySlider.enabled=false;
						_root.mySlider.dragger.enabled=false;
						_root.mySlider.Btn_Click.enabled=false;
					}
				} else {
					if (_global.playSwfFileName.indexOf("FQ")==-1) {
						_root.pause_mc._visible = false;
						_root.play_mc._visible = true;
					}
					_root.animation_mc.animation.stop();
					_root.animation_mc.animation.s_aud1.gotoAndStop(1);
					_global.CurPlayFrame = _root.animation_mc.animation._currentframe;
					if (_global.randomAudio == true) {
						_global.gSound.setVolume(0);
					}
				}
			}
		}
	} else {
		_root.nextani.gotoAndStop(1);
	}
	
	if (_global.playSwfFileName.indexOf("FQ02")!=-1) {
		_root.pause_mc._visible=false;
		_root.play_mc._visible=false;
	}	
	if (_global.playSwfFileName.indexOf("FQ02")!=-1) {
		if (_root.dtfKeyTermsTabInQuiz.text.toLowerCase()=="on") {
			_root.keyterms_but._visible = true;

		} else {
			_root.keyterms_but._visible = false;
		}
	} else {
		if (_root.dtfKeyTermsTabInLesson.text.toLowerCase()=="off") {
			_root.keyterms_but._visible = false;

		} else {
			_root.keyterms_but._visible = true;
		}	
	}
}

function doCheckRndAudio() {
	splTempChkName_1 = _global.playSwfFileName.split('/');
	flgExists = false;
	for (i=0;i<_global.arrayTotalRndAudioDetails.length;i++) {
		newTempSpl = _global.arrayTotalRndAudioDetails[i].split("~");
		for (j=2;j<newTempSpl.length;j++) {
			splTempChkName_2 = newTempSpl[j].split("/");
			if (splTempChkName_1[splTempChkName_1.length-1] == splTempChkName_2[splTempChkName_2.length-1]) {
				flgExists = true;
			}			
		}
	}
	
	if (flgExists) {
		_global.rndAud = random(3)+1;
		_global.rndAudLabel = "S"+_global.rndAud;
		_root.Mc_Random_Audio.gotoAndPlay(_global.rndAudLabel)
		_global.gSound = new Sound();
		_global.gSound.attachSound(_global.rndAudLabel);
		_global.gSound.start();
		_global.gSound.setVolume(_global.VolLevel);
		_global.randomAudio = true;
	} else {
		_global.randomAudio = false;
		_root.s_aud1.gotoAndStop(1);
	}	
}

function doCheckBGText() {
	splTempChkName_1 = _global.playSwfFileName.split('/');
	flgExists = false;
	for (i=0;i<_global.arrayTotalBgTextDetails.length;i++) {
		newTempSpl = _global.arrayTotalBgTextDetails[i].split("~");
		for (j=2;j<newTempSpl.length;j++) {
			splTempChkName_2 = newTempSpl[j].split("/");
			if (splTempChkName_1[splTempChkName_1.length-1] == splTempChkName_2[splTempChkName_2.length-1]) {
				flgExists = true;
			}			
		}
	}
	if (flgExists) {
		_root.Mc_BackText._visible = true;
	} else {
		_root.Mc_BackText._visible = false;
	}
}

function doForAndRew() {
	if (_root.animation_mc.animation.start == true && _global.forward == 1) {
		_root.animation_mc.animation.val = _root.animation_mc.animation._currentframe;
		_root.animation_mc.animation.val += 20;
		if (_root.animation_mc.animation.val>=_root.animation_mc.animation._totalframes) {
			_root.popup.gotoAndStop(1);
			_root.animation_mc.animation.gotoAndStop(_root.animation_mc.animation._totalframes);
		} else {
			_root.animation_mc.animation.gotoAndStop(_root.animation_mc.animation.val);
			if (_global.quizSection == false) {
				_root.animation_mc.animation.play();
			}
		}
	} else {
		if (_root.animation_mc.animation.start == true && _global.rewind == 1) {
			_root.animation_mc.animation.val = _root.animation_mc.animation._currentframe;
			_root.animation_mc.animation.val -= 20;
			if (_root.animation_mc.animation.val<=1) {
				_root.animation_mc.animation.gotoAndPlay(1);
				_root.popup.gotoAndStop(1);
			} else {
				_root.animation_mc.animation.gotoAndStop(_root.animation_mc.animation.val);
				if (_global.quizSection == false) {
					_root.animation_mc.animation.play();
				}
			}
		}
	}
}

function doPutBackAndFinished() {
	var flgExists;
	flgExists = false;
	var splTempChkName;
	splTempChkName = _global.playSwfFileName.substring(0, _global.playSwfFileName.length-4).split('/');
	for (i=0; i<_global.arrFinishSlide.length; i++) {
		if (_global.arrFinishSlide[i] == splTempChkName[splTempChkName.length-5]+","+splTempChkName[splTempChkName.length-4]+","+splTempChkName[splTempChkName.length-3]+","+splTempChkName[splTempChkName.length-2]+","+splTempChkName[splTempChkName.length-1]) {
			flgExists = true;
		}
	}
	if (flgExists == false) {
		_global.arrFinishSlide.push(splTempChkName[splTempChkName.length-5]+","+splTempChkName[splTempChkName.length-4]+","+splTempChkName[splTempChkName.length-3]+","+splTempChkName[splTempChkName.length-2]+","+splTempChkName[splTempChkName.length-1]);
	}
	if (_global.arrGoBack[_global.arrGoBack.length-1] != splTempChkName[splTempChkName.length-5]+","+splTempChkName[splTempChkName.length-4]+","+splTempChkName[splTempChkName.length-3]+","+splTempChkName[splTempChkName.length-2]+","+splTempChkName[splTempChkName.length-1]) {	
		_global.arrGoBack.push(splTempChkName[splTempChkName.length-5]+","+splTempChkName[splTempChkName.length-4]+","+splTempChkName[splTempChkName.length-3]+","+splTempChkName[splTempChkName.length-2]+","+splTempChkName[splTempChkName.length-1]);
	}
}

function DoHyperLinks() {
	//Begin Page HyperLink ONOFF
		//if (_root.dtfKTLesson.text.toUpperCase()=="OFF" && (_global.section=="Instruction" || _global.section=="Try It")) {
		if (_root.dtfKTLesson.text.toUpperCase()=="OFF") {
		} else {
			_global.engKTSoundMp3.stop();
			_root.m_c.McKTEAudio.gotoAndStop(1);
			_root.m_c.McKTSAudio.gotoAndStop(1);
			_global.CompClick = "HyperLink";
			_global.Pause = true;
			_global.Play = false;
			_root.popup.gotoAndStop(1);
			_root.mover_mc.gotoAndStop("inactive");
			_root.nextani.gotoAndStop(1);
			_root.navi.enabled = false;
			_root.glossary._visible = false;
			_root.m1_l1._visible = false;
			_root.calculator._visible = false;
			_root.Mc_Formulas._visible = false;
			_root.ct_center.gotoAndStop(2);
			_root.m_c.gotoAndStop(6);
			_root.m_c._visible = true;

			_global.KeyAttribute = _global.KeyAttribute + "~English";
			_global.openScrKey = true;
			_root.m_c.doGetSubLink(_global.KeyAttribute);
		}
	//End Page HyperLink ONOFF
}


function doGetSwfFileName(mcClipName,tempSection) {
	_global.sectionNumber = tempSection-1;
	tempArrGetSwf = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");
	for (i=2;i<tempArrGetSwf.length;i++) {
		splTempChkName = tempArrGetSwf[i].substring(0, tempArrGetSwf[i].length-4).split('/');
		mcName = splTempChkName[splTempChkName.length-1];
		if (mcName==mcClipName) {
			_global.slideNumber = i;
			_global.playSwfFileName = _global.MainFilePath+tempArrGetSwf[i];
		}
	}
}

function doGetSQSwfFileName(mcClipName) {
	tempArrGetSwf = _global.arrayTotalSectionDetails[_global.sectionNumber].split("~");
	for (i=2;i<tempArrGetSwf.length;i++) {
		splTempChkName = tempArrGetSwf[i].substring(0, tempArrGetSwf[i].length-4).split('/');
		tempMcName = "";
		for (j=0;j<splTempChkName.length;j++) {
			if (tempMcName=="") {
				tempMcName = splTempChkName[j];
			} else {
				tempMcName = tempMcName+","+splTempChkName[j];

			}
		}
		mcName = tempMcName;		

		if (mcName == mcClipName) {
			_global.slideNumber = i;
			_global.playSwfFileName = _global.MainFilePath+tempArrGetSwf[i];
		}
	}
}

function doPlaySpanishAudio() {
	if (_global.newTitleTag==true) {	
		if (_global.sectionNumber>=0 && _global.sectionNumber<_global.arrayTotalSectionDetails.length) {
			_global.Pause = true;
			_global.Play = false;
			_root.animation_mc.animation.stop();
			_root.animation_mc.animation.Mc_Feed1.stop();
			_root.animation_mc.animation.Mc_Feed2.stop();
			_root.animation_mc.animation.Mc_Feed3.stop();
			_root.animation_mc.animation.Mc_Feed4.stop();
			_root.pause_mc._visible = false;
			_root.play_mc._visible=true;
			_root.glossary._visible = false;
			_root.calculator._visible = false;
			_root.Mc_Formulas._visible = false;
			_root.m_c._visible = false;


			_global.showLoading_Spanish = true;

			_root.SA._visible=false;
			_root.SA_PLAY._alpha=100;
			_root.SA_PAUSE._alpha=100;

			_root.SA_PLAY._visible=false;
			_root.SA_PAUSE._visible=true;		

			_root.EA._visible=true;
			_global.spanSound=true;

			SFTemFName = _global.playSwfFileName.split("/");
			SSTemFName = SFTemFName[SFTemFName.length-1].split(".");
			_root.animation_mc.animation.stop();
			spanishAudioURL = "";
			for (i=0;i<SFTemFName.length-2;i++) {
				if (spanishAudioURL=="") {
					spanishAudioURL = SFTemFName[i];
				} else {
					spanishAudioURL = spanishAudioURL+"/"+SFTemFName[i];
				}
			}
			SndFName = spanishAudioURL+"/SA/" + SSTemFName[0] + ".mp3";

			_global.spanSoundMp3 = new Sound();

			_global.spanSoundMp3.onLoad = function(success) {
				if (success) {
					if (_global.showLoading_Spanish) {
						_global.spanSoundMp3.start(0);
					}
				} else {

				}
			}

			for(i=1;i<=4;i++) {
				eval("_root.animation_mc.animation.Mc_Feed" + i).gotoAndStop(1);
				eval("_root.animation_mc.animation.Mc_Right_Feed" + i).gotoAndStop(1);
				eval("_root.animation_mc.animation.Mc_Wrong_Feed" + i).gotoAndStop(1);
			}
			_root.animation_mc.animation.Feed_Right.gotoAndStop(1);
			_root.animation_mc.animation.Feed_Wrong.gotoAndStop(1);

			_global.spanSoundMp3.loadSound(SndFName,false);
			_global.spanSoundMp3.onSoundComplete = function() {
				_global.spanSoundMp3.stop();
				_global.spanSoundMp3.unLoad();
				_root.doStopSpanishAudio()
			};		
		}
	} else {
		if (_global.sectionNumber>=1 && _global.sectionNumber<_global.arrayTotalSectionDetails.length) {
			_global.Pause = true;
			_global.Play = false;
			_root.animation_mc.animation.stop();
			_root.animation_mc.animation.Mc_Feed1.stop();
			_root.animation_mc.animation.Mc_Feed2.stop();
			_root.animation_mc.animation.Mc_Feed3.stop();
			_root.animation_mc.animation.Mc_Feed4.stop();
			_root.pause_mc._visible = false;
			_root.play_mc._visible=true;
			_root.glossary._visible = false;
			_root.calculator._visible = false;
			_root.Mc_Formulas._visible = false;
			_root.m_c._visible = false;


			_global.showLoading_Spanish = true;

			_root.SA._visible=false;
			_root.SA_PLAY._alpha=100;
			_root.SA_PAUSE._alpha=100;

			_root.SA_PLAY._visible=false;
			_root.SA_PAUSE._visible=true;		

			_root.EA._visible=true;
			_global.spanSound=true;

			SFTemFName = _global.playSwfFileName.split("/");
			SSTemFName = SFTemFName[SFTemFName.length-1].split(".");
			_root.animation_mc.animation.stop();
			spanishAudioURL = "";
			for (i=0;i<SFTemFName.length-2;i++) {
				if (spanishAudioURL=="") {
					spanishAudioURL = SFTemFName[i];
				} else {
					spanishAudioURL = spanishAudioURL+"/"+SFTemFName[i];
				}
			}

			SndFName = spanishAudioURL+"/SA/" + SSTemFName[0] + ".mp3";

			_global.spanSoundMp3 = new Sound();

			_global.spanSoundMp3.onLoad = function(success) {
				if (success) {
					if (_global.showLoading_Spanish) {
						_global.spanSoundMp3.start(0);
					}
				} else {

				}
			}

			for(i=1;i<=4;i++) {
				eval("_root.animation_mc.animation.Mc_Feed" + i).gotoAndStop(1);
				eval("_root.animation_mc.animation.Mc_Right_Feed" + i).gotoAndStop(1);
				eval("_root.animation_mc.animation.Mc_Wrong_Feed" + i).gotoAndStop(1);
			}
			_root.animation_mc.animation.Feed_Right.gotoAndStop(1);
			_root.animation_mc.animation.Feed_Wrong.gotoAndStop(1);

			_global.spanSoundMp3.loadSound(SndFName,false);
			_global.spanSoundMp3.onSoundComplete = function() {
				_global.spanSoundMp3.stop();
				_global.spanSoundMp3.unLoad();
				_root.doStopSpanishAudio()
			};		
		}	
	}
}


function doStopSpanishAudio() {
	_global.spanSoundMp3.stop();
	_global.spanSoundMp3.unload();
	if (_root.animation_mc.animation._currentframe!=_root.animation_mc.animation._totalframes&&_global.quizSection==false) {
		_root.animation_mc.animation.play();
	}
	_global.Play = true;
	_global.Pause = false;
	_root.SA._visible=true;
	_root.EA._visible=false;
	_global.spanSound=false;
	if (_root.animation_mc.animation.Mc_Feed1._currentframe>1) {
		_root.animation_mc.animation.Mc_Feed1.play();
	}
	if (_root.animation_mc.animation.Mc_Feed2._currentframe>1) {
		_root.animation_mc.animation.Mc_Feed2.play();
	}
	if (_root.animation_mc.animation.Mc_Feed3._currentframe>1) {
		_root.animation_mc.animation.Mc_Feed3.play();
	}
	if (_root.animation_mc.animation.Mc_Feed4._currentframe>1) {
		_root.animation_mc.animation.Mc_Feed4.play();
	}
	_root.pause_mc._visible = true;
	_root.play_mc._visible = false;
	_root.glossary._visible = false;
	_root.calculator._visible = false;
	_root.Mc_Formulas._visible = false;
	_root.m_c._visible = false;
	
	_global.showLoading_Spanish = false;
	_root.SA._visible=true;
	_root.EA._visible=false;
	_global.spanSound=false;
	
	_root.SA_PLAY._visible=false;
	_root.SA_PAUSE._visible=false;	
}

function doCreateGlossaryWord(M_Name) {
	_global.engKTSoundMp3.stop();
	_root.glossary.keyterms.McKTEAudio.gotoAndStop(1);
	_root.glossary.keyterms.McKTSAudio.gotoAndStop(1);
	_global.btnKeyTermsPressed = undefined;
    _global.arrTempKeyTerm = new Array();
    M_Name = M_Name+"_";
    _root.glossary.keyterms.BtnBack._visible=false;
    F_X = new XML();
    _root.QU = _global.KeyTermVar;
    F_X.load(_global.KeyTermVar);
    F_X.ignoreWhite = true;
    F_X.onLoad = function() {
        T_L = F_X.firstChild.childNodes.length;
        S_X = F_X.firstChild;
		_root.glossary.keyterms.McKTWordList.removeAll();
		_root.glossary.keyterms.McKTWordList.scrollBar_mc.scrollPosition = 0;
        for (i=0; i<T_L; i++) {
            S_L = S_X.childNodes[i].nodeName;
            splLng = S_L.split('~LNG~');
            lngEng = splLng[0];
            lngSpan = splLng[1];
            if (lngEng.indexOf('~')<>-1) {
                tempSpl = lngEng.split('~');
                newTempSpl = "";
                for (k=0; k<=tempSpl.length-1; k++) {
                    if (newTempSpl == "") {
                        newTempSpl = tempSpl[k];
                    } else {
                        newTempSpl = newTempSpl+" "+tempSpl[k];
                    }
                }
                lngEng = newTempSpl;
                
            }
            if (lngSpan.indexOf('~')<>-1) {
                tempSpl = lngSpan.split('~');
                newTempSpl = "";
                for (k=0; k<=tempSpl.length-1; k++) {
                    if (newTempSpl == "") {
                        newTempSpl = tempSpl[k];
                    } else {
                        newTempSpl = newTempSpl+" "+tempSpl[k];
                    }
                }
                lngSpan = newTempSpl;
                
            }           
            
            S_T = S_X.childNodes[i].firstChild;
			tempArrStoreValue = M_Name add i;
            _global.arrTempKeyTerm.push(tempArrStoreValue);
			if (_global.LngFlag == "English") {
				_root.glossary.keyterms.McKTWordList.addItem(lngEng, tempArrStoreValue);
            } else {
				_root.glossary.keyterms.McKTWordList.addItem(lngSpan, tempArrStoreValue);
            }
            tempKeyTermValue = M_Name add i+"SPLDATA"+lngEng+"SPLDATA"+lngSpan+"SPLDATA"+S_T+"SPLDATA"+S_X.childNodes[i].attributes.SubLinkEng+"SPLDATA"+S_X.childNodes[i].attributes.SubLinkSpan+"SPLDATA"+S_X.childNodes[i].attributes.ExFileName+"SPLDATA"+S_X.childNodes[i].attributes.ScreenKeyTerm;
            _global.arrKeyTermBank[i] = tempKeyTermValue;
        }
    };
    _root.doVisibleKeyAlphBut();
    _root.glossary.keyterms.mouse_down._x=_root.glossary.keyterms.x_pos;
    _root.glossary.keyterms.mouse_down._y=_root.glossary.keyterms.y_pos;
}

function doCreateGlossAlph(M_Name, Word) {
	_global.engKTSoundMp3.stop();
	_root.glossary.keyterms.McKTEAudio.gotoAndStop(1);
	_root.glossary.keyterms.McKTSAudio.gotoAndStop(1);
    _global.arrTempKeyTerm = new Array();
    M_Name = M_Name+"_";
    _root.glossary.keyterms.BtnBack._visible=false;
    F_W = Word;
    F_X = new XML();
    F_X.load(_global.KeyTermVar);
    F_X.ignoreWhite = true;
    F_X.onLoad = function() {
        T_L = F_X.firstChild.childNodes.length;
        S_X = F_X.firstChild;
		_root.glossary.keyterms.McKTWordList.removeAll();
		_root.glossary.keyterms.McKTWordList.scrollBar_mc.scrollPosition = 0;
        for (i=0; i<T_L; i++) {
            if (_global.LngFlag=="English") {
                C_N = S_X.childNodes[i].attributes.EngCategory;
            } else {
                C_N = S_X.childNodes[i].attributes.SpanCategory;
            }
            if (C_N.toLowerCase()==F_W.toLowerCase()) {
                S_L = S_X.childNodes[i].nodeName;
                splLng = S_L.split('~LNG~');
                lngEng = splLng[0];
                lngSpan = splLng[1];
                if (lngEng.indexOf('~')<>-1) {
                    tempSpl = lngEng.split('~');
                    newTempSpl = "";
                    for (k=0; k<=tempSpl.length-1; k++) {
                        if (newTempSpl == "") {
                            newTempSpl = tempSpl[k];
                        } else {
                            newTempSpl = newTempSpl+" "+tempSpl[k];
                        }
                    }
                    lngEng = newTempSpl;
                    
                }
                if (lngSpan.indexOf('~')<>-1) {
                    tempSpl = lngSpan.split('~');
                    newTempSpl = "";
                    for (k=0; k<=tempSpl.length-1; k++) {
                        if (newTempSpl == "") {
                            newTempSpl = tempSpl[k];
                        } else {
                            newTempSpl = newTempSpl+" "+tempSpl[k];
                        }
                    }
                    lngSpan = newTempSpl;
                    
                }
                S_T = S_X.childNodes[i].firstChild;
				tempArrStoreValue = M_Name add i;
				_global.arrTempKeyTerm.push(tempArrStoreValue);
				if (_global.LngFlag == "English") {
					_root.glossary.keyterms.McKTWordList.addItem(lngEng, tempArrStoreValue);
				} else {
					_root.glossary.keyterms.McKTWordList.addItem(lngSpan, tempArrStoreValue);
				}				
            }
            
        }
    };
    _root.glossary.keyterms.keyterm_diagram.unloadMovie();
}

function doDisplayGlossDescription(tempRefValue) {
	_root.glossary.keyterms.McKTWordList._visible = false;
	_global.engKTSoundMp3.stop();
	_root.glossary.keyterms.gotoAndStop(2);
	_root.glossary.keyterms.McKTEAudio.gotoAndStop(1);
	_root.glossary.keyterms.McKTSAudio.gotoAndStop(1);	
    _root.glossary.keyterms.BtnBack._visible=false;
    splTemp = tempRefValue.split("_");
    //Creating Sub Links
    tempKeyTerm = _global.arrKeyTermBank[parseFloat(splTemp[1])];
    splKeyTerm = tempKeyTerm.split("SPLDATA");
    _root.glossary.keyterms.title = splKeyTerm[1];
    _root.glossary.keyterms.spanish_title = splKeyTerm[2];
    splKeyTermDesc = splKeyTerm[3].split("~LNG~");
    //English Sub Link
    tempDescription = splKeyTermDesc[0];
    tempSubLink = splKeyTerm[4];
    if (tempSubLink!="" && tempSubLink!=undefined && tempSubLink!="undefined") {
        splTempSubLink = new Array();
        splTempSubLink = tempSubLink.split("~");
        for (i=0;i<splTempSubLink.length;i++) {
            splTempLinkWord = splTempSubLink[i].split(",");
            splTempDesc = tempDescription.split(splTempLinkWord[0]);
            tempLinkVal = "";
            for (j=0;j<splTempDesc.length;j++) {
                if (j==0) {
                    if (splTempDesc[j]=="") {
                        tempLinkVal = "<A HREF='asfunction:doGetSubLink," + splTempLinkWord[1] + "~English'><FONT COLOR='#006600'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>"
                    } else {
                        tempLinkVal = splTempDesc[j];
                    }
                } else  {
                if (j==1) {
                    if (splTempDesc[j-1]=="") {
                        tempLinkVal = tempLinkVal + splTempDesc[j];
                    } else {
                        tempLinkVal = tempLinkVal + "<A HREF='asfunction:doGetSubLink," + splTempLinkWord[1] + "~English'><FONT COLOR='#006600'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>" + splTempDesc[j];                      
                    }
                } else {
                    tempLinkVal = tempLinkVal + splTempLinkWord[0] + splTempDesc[j];
                }}
            }
            tempDescription = tempLinkVal;
        }
        splTempSpace = tempDescription.split("</A> <A");
        tempFinalKTDef = "";
        for (i=0;i<splTempSpace.length;i++) {
            if (tempFinalKTDef=="") {
                tempFinalKTDef = splTempSpace[i];
            } else {
                tempFinalKTDef = tempFinalKTDef + "</A>&nbsp;<A" + splTempSpace[i];
            }
        }
        _root.glossary.keyterms.DesEng.htmlText = tempFinalKTDef;
    } else {
        _root.glossary.keyterms.DesEng.htmlText = tempDescription;
    }
    //Spanish Sub Link
    tempDescription = splKeyTermDesc[1];
    tempSubLink = splKeyTerm[5];
    if (tempSubLink!="" && tempSubLink!=undefined && tempSubLink!="undefined") {
        splTempSubLink = new Array();
        splTempSubLink = tempSubLink.split("~");
        for (i=0;i<splTempSubLink.length;i++) {
            splTempLinkWord = splTempSubLink[i].split(",");
            splTempDesc = tempDescription.split(splTempLinkWord[0]);
            tempLinkVal = "";
            for (j=0;j<splTempDesc.length;j++) {
                if (j==0) {
                    if (splTempDesc[j]=="") {
                        tempLinkVal = "<A HREF='asfunction:doGetSubLink," + splTempLinkWord[1] + "~Spanish'><FONT COLOR='#006600'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>"
                    } else {
                            tempLinkVal = splTempDesc[j];
                    }
                } else  {
                if (j==1) {
                    if (splTempDesc[j-1]=="") {
                        tempLinkVal = tempLinkVal + splTempDesc[j];
                    } else {
                        tempLinkVal = tempLinkVal + "<A HREF='asfunction:doGetSubLink," + splTempLinkWord[1] + "~Spanish'><FONT COLOR='#006600'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>" + splTempDesc[j];                      
                    }
                } else {
                    tempLinkVal = tempLinkVal + splTempLinkWord[0] + splTempDesc[j];
                }}
            }
            tempDescription = tempLinkVal;
        }
        splTempSpace = tempDescription.split("</A> <A");
        tempFinalKTDef = "";
        for (i=0;i<splTempSpace.length;i++) {
            if (tempFinalKTDef=="") {
                tempFinalKTDef = splTempSpace[i];
            } else {
                tempFinalKTDef = tempFinalKTDef + "</A>&nbsp;<A" + splTempSpace[i];
            }
        }       
        _root.glossary.keyterms.DesSpan.htmlText = tempFinalKTDef;
    } else {
        _root.glossary.keyterms.DesSpan.htmlText = tempDescription;
    }
    exampleSwfFileName = _global.xmlPath+"DIG/" + splKeyTerm[6].toLowerCase();
    _root.glossary.keyterms.keyterm_diagram.unloadMovie();
    _root.glossary.keyterms.keyterm_diagram.loadMovie(exampleSwfFileName, 7);
    tempSplSndKTFName = splKeyTerm[6].toLowerCase().split(".");
    SndKTEFName = _global.xmlPath+"EAD/" + tempSplSndKTFName[0] + ".mp3";
    SndKTSFName = _global.xmlPath+"SAD/" + tempSplSndKTFName[0] + ".mp3";
    if (_global.LngFlag == "English") {
        _global.backLinkWord = splKeyTerm[1]+"~English";
    } else {
        _global.backLinkWord = splKeyTerm[2]+"~Spanish";
    }
    //Begin Click Project Global for MLC
	if (_root.dtfClicks.text.toUpperCase()=="ON") {
		_root.strIndexGlobalButttonClickType = "KTDICT";
		//strTempIndexGlobalClickDesc = _root.glossary.keyterms.TitleEng.text + "~" + _root.glossary.keyterms.DesEng.text + "~" + _root.glossary.keyterms.TitleSpan.text + "~" + _root.glossary.keyterms.DesSpan.text;
		if (_global.LngFlag.toUpperCase()=="ENGLISH") {
			strTempIndexGlobalClickDesc = _root.glossary.keyterms.TitleEng.text;
		} else {
			strTempIndexGlobalClickDesc = _root.glossary.keyterms.TitleSpan.text;
		}
		strTempIndexGlobalClickDesc = strTempIndexGlobalClickDesc.split("&").join("ANDSYM");
		_root.strIndexGlobalClickDesc = strTempIndexGlobalClickDesc;
		_root.strFinalClickURL = "";
		_root.Send_Click_Report_Mc.gotoAndPlay(2);
	}
	//End Click Project Global for MLC    
}

function doCreateSubLink(subLinkWord) {
	_global.engKTSoundMp3.stop();
	_root.glossary.keyterms.McKTEAudio.gotoAndStop(1);
	_root.glossary.keyterms.McKTSAudio.gotoAndStop(1);
	_root.glossary.keyterms.BtnBack._visible=true;
	splSubLinkWord = subLinkWord.split("~");
	tempInt = -1;
	chkSubInt = 0;
	
	for (i=0;i<_global.arrKeyTermBank.length;i++) {
		splKeyTerm = _global.arrKeyTermBank[i].split("SPLDATA");
		if (splSubLinkWord[1]=="English") {
			tempLangChkWord = splKeyTerm[1];
		} else {
			tempLangChkWord = splKeyTerm[2];
		}
		
		if (splKeyTerm[1].toLowerCase()==splSubLinkWord[0].toLowerCase()) {
		tempLangChkWord = splKeyTerm[1];
		} else {
		if (splKeyTerm[2].toLowerCase()==splSubLinkWord[0].toLowerCase()) {
			tempLangChkWord = splKeyTerm[2];
		} }
		
		tempSubLinkWord = splSubLinkWord[0];
		if (tempSubLinkWord.indexOf("_")==-1) {
			subLinkWord = splSubLinkWord[0];
			if (tempLangChkWord.toLowerCase()==subLinkWord.toLowerCase()) {
				chkSubInt++
				if (chkSubInt==1) {
					tempInt = i;
				}

			}			
		} else {
			tempSplSubLinkWord = tempSubLinkWord.split("_");
			subLinkWord = tempSplSubLinkWord[0];
			if (tempLangChkWord.toLowerCase()==subLinkWord.toLowerCase()) {
				chkSubInt++;
				if (Number(tempSplSubLinkWord[1]) == chkSubInt) {
					tempInt = i;
				}
			}			
		}
	}
	splKeyTerm = _global.arrKeyTermBank[tempInt].split("SPLDATA");
	_root.glossary.keyterms.title = splKeyTerm[1];
	_root.glossary.keyterms.spanish_title = splKeyTerm[2];	
	splKeyTermDesc = splKeyTerm[3].split("~LNG~");
	//English Sub Link
	tempDescription = splKeyTermDesc[0];
	tempSubLink = splKeyTerm[4];
	if (tempSubLink!="" && tempSubLink!=undefined && tempSubLink!="undefined") {
		splTempSubLink = new Array();

		splTempSubLink = tempSubLink.split("~");
		
		for (i=0;i<splTempSubLink.length;i++) {
			splTempLinkWord = splTempSubLink[i].split(",");
			splTempDesc = tempDescription.split(splTempLinkWord[0]);
			tempLinkVal = "";
			for (j=0;j<splTempDesc.length;j++) {
				if (j==0) {
					if (splTempDesc[j]=="") {
						tempLinkVal = "<A HREF='asfunction:doGetSubLink," + splTempLinkWord[1] + "~English'><FONT COLOR='#006600'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>"
					} else {
							tempLinkVal = splTempDesc[j];
					}
				} else  {
				if (j==1) {
					if (splTempDesc[j-1]=="") {
						tempLinkVal = tempLinkVal + splTempDesc[j];
					} else {
						tempLinkVal = tempLinkVal + "<A HREF='asfunction:doGetSubLink," + splTempLinkWord[1] + "~English'><FONT COLOR='#006600'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>" + splTempDesc[j];						
					}
				} else {
					tempLinkVal = tempLinkVal + splTempLinkWord[0] + splTempDesc[j];
				}}
			}
			tempDescription = tempLinkVal;
		}
		splTempSpace = tempDescription.split("</A> <A");
		tempFinalKTDef = "";
		for (i=0;i<splTempSpace.length;i++) {
			if (tempFinalKTDef=="") {
				tempFinalKTDef = splTempSpace[i];
			} else {
				tempFinalKTDef = tempFinalKTDef + "</A>&nbsp;<A" + splTempSpace[i];
			}
		}
		_root.glossary.keyterms.DesEng.htmlText = tempFinalKTDef;
	} else {
		_root.glossary.keyterms.DesEng.htmlText = tempDescription;
	}

	
	//Spanish Sub Link
	tempDescription = splKeyTermDesc[1];
	tempSubLink = splKeyTerm[5];
	if (tempSubLink!="" && tempSubLink!=undefined && tempSubLink!="undefined") {
		splTempSubLink = new Array();
		splTempSubLink = tempSubLink.split("~");
		for (i=0;i<splTempSubLink.length;i++) {
			splTempLinkWord = splTempSubLink[i].split(",");
			splTempDesc = tempDescription.split(splTempLinkWord[0]);
			tempLinkVal = "";
			for (j=0;j<splTempDesc.length;j++) {
				if (j==0) {
					if (splTempDesc[j]=="") {
						tempLinkVal = "<A HREF='asfunction:doGetSubLink," + splTempLinkWord[1] + "~Spanish'><FONT COLOR='#006600'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>"
					} else {
						tempLinkVal = splTempDesc[j];
					}
				} else  {
				if (j==1) {
					if (splTempDesc[j-1]=="") {
						tempLinkVal = tempLinkVal + splTempDesc[j];
					} else {
						tempLinkVal = tempLinkVal + "<A HREF='asfunction:doGetSubLink," + splTempLinkWord[1] + "~Spanish'><FONT COLOR='#006600'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>" + splTempDesc[j];						
					}
				} else {
					tempLinkVal = tempLinkVal + splTempLinkWord[0] + splTempDesc[j];
				}}
			}
			tempDescription = tempLinkVal;
		}
		splTempSpace = tempDescription.split("</A> <A");
		tempFinalKTDef = "";
		for (i=0;i<splTempSpace.length;i++) {
			if (tempFinalKTDef=="") {
				tempFinalKTDef = splTempSpace[i];
			} else {
				tempFinalKTDef = tempFinalKTDef + "</A>&nbsp;<A" + splTempSpace[i];
			}
		}		
		_root.glossary.keyterms.DesSpan.htmlText = tempFinalKTDef;
	} else {
		_root.glossary.keyterms.DesSpan.htmlText = tempDescription;
	}
	
	exampleSwfFileName = _global.xmlPath+"DIG/" + splKeyTerm[6].toLowerCase();

	tempSplSndKTFName = splKeyTerm[6].toLowerCase().split(".");
	SndKTEFName = _global.xmlPath+"EAD/" + tempSplSndKTFName[0] + ".mp3";
	SndKTSFName = _global.xmlPath+"SAD/" + tempSplSndKTFName[0] + ".mp3";

	_root.glossary.keyterms.keyterm_diagram.unloadMovie();
	_root.glossary.keyterms.keyterm_diagram.loadMovie(exampleSwfFileName, 7);
	
    //Begin Click Project Global for MLC
	if (_root.dtfClicks.text.toUpperCase()=="ON") {
		_root.strIndexGlobalButttonClickType = "KTDICT";
		//strTempIndexGlobalClickDesc = _root.glossary.keyterms.TitleEng.text + "~" + _root.glossary.keyterms.DesEng.text + "~" + _root.glossary.keyterms.TitleSpan.text + "~" + _root.glossary.keyterms.DesSpan.text;
		if (_global.LngFlag.toUpperCase()=="ENGLISH") {
			strTempIndexGlobalClickDesc = _root.glossary.keyterms.TitleEng.text;
		} else {
			strTempIndexGlobalClickDesc = _root.glossary.keyterms.TitleSpan.text;
		}
		strTempIndexGlobalClickDesc = strTempIndexGlobalClickDesc.split("&").join("ANDSYM");
		_root.strIndexGlobalClickDesc = strTempIndexGlobalClickDesc;
		_root.strFinalClickURL = "";
		_root.Send_Click_Report_Mc.gotoAndPlay(2);
	}	
	//End Click Project Global for MLC	
}

function doPlayKeyTermAudio(mcTemp, strKTAudioLang) {
	_global.engKTSoundMp3.stop();
	if (eval(mcTemp)._name.toString()=="McKTSAudio") {
		_root.glossary.keyterms.McKTEAudio.gotoAndStop(1);
	}
	if (eval(mcTemp)._name.toString()=="McKTEAudio") {
		_root.glossary.keyterms.McKTSAudio.gotoAndStop(1);
	}
	if (eval(mcTemp)._name.toString()=="McKTEAudio") { 
		_root.m_c.McKTSAudio.gotoAndStop(1);
	}
	if (eval(mcTemp)._name.toString()=="McKTSAudio") {
		_root.m_c.McKTEAudio.gotoAndStop(1);
	}
	if (eval(mcTemp)._currentframe==1) {
		eval(mcTemp).gotoAndStop(2);
		_global.engKTSoundMp3 = new Sound();
		_global.engKTSoundMp3.onLoad = function(success) {
			if (success) {
				_global.engKTSoundMp3.start(0);
			} else {
	
			}
		}
		if (strKTAudioLang == "English") {
			_global.engKTSoundMp3.loadSound(SndKTEFName,false);
		} else {
			_global.engKTSoundMp3.loadSound(SndKTSFName,false);
		}

		_global.engKTSoundMp3.onSoundComplete = function() {
			eval(mcTemp).gotoAndStop(1);
			_global.engKTSoundMp3.stop();
			_global.engKTSoundMp3.unLoad();
		};		
		
	} else {
		eval(mcTemp).gotoAndStop(1);
		_global.engKTSoundMp3.stop();
	}
}

function doPlayFormulasAudio(mcTemp, strFMAudioLang, strAudioName) {
	_global.engFMSoundMp3.stop();
	if (eval(mcTemp)._name.toString()=="McFMSAudio") {
		_root.Mc_Formulas.McFMEAudio.gotoAndStop(1);
	}
	if (eval(mcTemp)._name.toString()=="McFMEAudio") {
		_root.Mc_Formulas.McFMSAudio.gotoAndStop(1);
	}
	if (eval(mcTemp)._currentframe==1) {
		eval(mcTemp).gotoAndStop(2);
		_global.engFMSoundMp3 = new Sound();
		_global.engFMSoundMp3.onLoad = function(success) {
			if (success) {
				_global.engFMSoundMp3.start(0);
			} else {
	
			}
		}
		
    	SndFMEFName = _global.formulasPath+"EAD/" + strAudioName + ".mp3";
    	SndFMSFName = _global.formulasPath+"SAD/" + strAudioName + ".mp3";	
		
		if (strFMAudioLang == "English") {
			_global.engFMSoundMp3.loadSound(SndFMEFName,false);
		} else {
			_global.engFMSoundMp3.loadSound(SndFMSFName,false);
		}
		
		_global.engFMSoundMp3.onSoundComplete = function() {
			eval(mcTemp).gotoAndStop(1);
			_global.engFMSoundMp3.stop();
			_global.engFMSoundMp3.unLoad();
		};		
		
	} else {
		eval(mcTemp).gotoAndStop(1);
		_global.engFMSoundMp3.stop();
	}
}

function doDisplayFormulaDef(strTempET, strTempST, strTempSWF) {
	_root.Mc_Formulas.TitleEng.text = strTempET;
	_root.Mc_Formulas.TitleSpan.text = strTempST;
	_root.Mc_Formulas.Mc_FormulaDEF.loadMovie(_global.formulasPath+"SWF/" + strTempSWF + ".swf");
	//_root.Mc_Formulas.Mc_Formulas_ENGDEF.loadMovie(_global.formulasPath+"SWF/" + strTempEDef + ".swf");
	//_root.Mc_Formulas.Mc_Formulas_SPADEF.loadMovie(_global.formulasPath+"SWF/" + strTempSDef + ".swf");
	//_root.Mc_Formulas.Mc_Formulas_DIG.loadMovie(_global.formulasPath+"SWF/" + strTempDIG + ".swf");
}

function doInitKeyTerms() {
	_global.engKTSoundMp3.stop();
	_root.glossary.keyterms.McKTEAudio.gotoAndStop(1);
	_root.glossary.keyterms.McKTSAudio.gotoAndStop(1);
	_root.glossary.keyterms.BtnBack._visible=false;
	_root.glossary.keyterms.gotoAndStop(1);
	_root.glossary.keyterms.BtnEng._visible = false;
	_root.glossary.keyterms.BtnSpan._visible = true;	
	_global.KeyTermVar = _global.xmlPath+"XML/ELKTEG4.xml";
	_root.doCreateGlossaryWord("Source");
}

function doClearKeyTermFields() {
    _root.glossary.keyterms.Display = "";
    _root.glossary.keyterms.title=""
    _root.glossary.keyterms.spanish_title=""	
	_root.glossary.keyterms.DesEng.text = "";
	_root.glossary.keyterms.DesSpan.text = "";
    _root.glossary.keyterms.DesEng.html=true;
    _root.glossary.keyterms.DesSpan.html=true;
}

function doVisibleKeyAlphBut() {
	_root.glossary.keyterms.gotoAndStop(1);
	_root.glossary.keyterms.McKTWordList._visible = true;	
	_root.glossary.keyterms.a._visible = true;
	_root.glossary.keyterms.b._visible = true;
	_root.glossary.keyterms.c._visible = true;
	_root.glossary.keyterms.d._visible = true;
	_root.glossary.keyterms.e._visible = true;
	_root.glossary.keyterms.f._visible = true;
	_root.glossary.keyterms.g._visible = true;
	_root.glossary.keyterms.h._visible = true;
	_root.glossary.keyterms.useri._visible = true;
	_root.glossary.keyterms.j._visible = true;
	_root.glossary.keyterms.userk._visible = true;
	_root.glossary.keyterms.l._visible = true;
	_root.glossary.keyterms.m._visible = true;
	_root.glossary.keyterms.n._visible = true;
	_root.glossary.keyterms.o._visible = true;
	_root.glossary.keyterms.p._visible = true;
	_root.glossary.keyterms.q._visible = true;
	_root.glossary.keyterms.r._visible = true;
	_root.glossary.keyterms.s._visible = true;
	_root.glossary.keyterms.t._visible = true;
	_root.glossary.keyterms.u._visible = true;
	_root.glossary.keyterms.v._visible = true;
	_root.glossary.keyterms.w._visible = true;
	_root.glossary.keyterms.x._visible = true;
	_root.glossary.keyterms.y._visible = true;
	_root.glossary.keyterms.z._visible = true;
	if (_global.btnKeyTermsPressed != "" && _global.btnKeyTermsPressed != undefined) {
		_root.glossary.keyterms[_global.btnKeyTermsPressed]._visible = false;
		_root.glossary.keyterms.mouse_down._x = _root.glossary.keyterms[_global.btnKeyTermsPressed]._x;
		_root.glossary.keyterms.mouse_down._y = _root.glossary.keyterms[_global.btnKeyTermsPressed]._y;
	}
}

function doCreateButAction(tempCat) {
	_root.doCreateGlossAlph("Source", tempCat);
	if (tempCat=="i") { tempCat="useri" };
	if (tempCat=="k") { tempCat="userk" };
	_global.btnKeyTermsPressed = tempCat;
	_root.doVisibleKeyAlphBut();
	_root.glossary.keyterms[tempCat]._visible = false;
	_root.glossary.keyterms.mouse_down._x = _root.glossary.keyterms[tempCat]._x;
	_root.glossary.keyterms.mouse_down._y = _root.glossary.keyterms[tempCat]._y;
	_root.glossary.keyterms.DesEng.text = "";
	_root.glossary.keyterms.title="";
	_root.glossary.keyterms.spanish_title="";
	_root.glossary.keyterms.DesSpan.text="";
}

function doKeyTermsReset() {
	_root.doVisibleKeyAlphBut();
	_root.glossary.keyterms.mouse_down._x=_root.glossary.keyterms.x_pos;
	_root.glossary.keyterms.mouse_down._y=_root.glossary.keyterms.y_pos;
	_root.glossary.keyterms.DesEng.text = "";
	_root.glossary.keyterms.title="";
	_root.glossary.keyterms.spanish_title="";
	_root.glossary.keyterms.DesSpan.text="";
	if (_global.LngFlag == "English") {
		_global.KeyTermVar = _global.xmlPath+"XML/ELKTEG4.xml";
	} else {
		_global.KeyTermVar = _global.xmlPath+"XML/ELKTSG4.xml";
	}
    _root.doCreateGlossaryWord("Source");
}

function doSwitchSpanGloss() {
    _root.doVisibleKeyAlphBut();
    _root.glossary.keyterms.mouse_down._x=_root.glossary.keyterms.x_pos;
    _root.glossary.keyterms.mouse_down._y=_root.glossary.keyterms.y_pos;
    _root.glossary.keyterms.BtnSpan._visible=false;
    _root.glossary.keyterms.BtnEng._visible=true;
    _root.mover_mc.gotoAndStop("inactive");	
    _global.KeyTermVar = _global.xmlPath+"XML/ELKTSG4.xml";
    _global.LngFlag = "Spanish"
    _root.doCreateGlossaryWord("Source");
}

function doSwitchEngGloss() {
    _root.doVisibleKeyAlphBut()
    _root.glossary.keyterms.mouse_down._x=_root.glossary.keyterms.x_pos;
    _root.glossary.keyterms.mouse_down._y=_root.glossary.keyterms.y_pos;
    _root.glossary.keyterms.BtnEng._visible=false;
    _root.glossary.keyterms.BtnSpan._visible=true;
	_root.mover_mc.gotoAndStop("inactive");
    _global.KeyTermVar = _global.xmlPath+"XML/ELKTEG4.xml";
    _global.LngFlag = "English"
    _root.doCreateGlossaryWord("Source");
}

function doInitSKT() {
	_root.m_c.stop();
	_root.m_c.keyterm_diagram.unloadMovie();
	_root.m_c.BtnBack._visible=false;
	_root.Activ();
}

function doCreateSKTSubLink(subLinkWord) {
	if (_global.openScrKey) {
		_root.m_c.BtnBack._visible=false;
		_global.openScrKey = false
	} else {
		_root.m_c.BtnBack._visible=true;
	}
	
	_root.m_c.english = "";
	_root.m_c.spanish = "";		
	_root.m_c.title_english = "";
	_root.m_c.Keycontent_english.htmlText = "";
	_root.m_c.title_spanish = "";
	_root.m_c.Keycontent_spanish.htmlText = "";

	_root.m_c.english = "English";
	_root.m_c.spanish = "Spanish";

	_root.m_c.Keycontent_english.html = true;
	_root.m_c.Keycontent_english.multiline = true;
	_root.m_c.Keycontent_english.wordWrap = true;

	_root.m_c.Keycontent_spanish.html = true;
	_root.m_c.Keycontent_spanish.multiline = true;
	_root.m_c.Keycontent_spanish.wordWrap = true;

	splSubLinkWord = subLinkWord.split("~");
	tempInt = "";
	chkSubInt = 0;
	
	for (i=0;i<_global.arrKeyTermBank.length;i++) {
		splKeyTerm = _global.arrKeyTermBank[i].split("SPLDATA");
		if (splSubLinkWord[1]=="English") {
			tempLangChkWord = splKeyTerm[1];
		} else {
			tempLangChkWord = splKeyTerm[2];
		}
		
		if (splKeyTerm[1].toLowerCase()==splSubLinkWord[0].toLowerCase()) {
			tempLangChkWord = splKeyTerm[1];
		} else {
		if (splKeyTerm[2].toLowerCase()==splSubLinkWord[0].toLowerCase()) {
			tempLangChkWord = splKeyTerm[2];
		} }
		
		tempSubLinkWord = splSubLinkWord[0];
		if (tempSubLinkWord.indexOf("_")==-1) {
			subLinkWord = splSubLinkWord[0];
			if (tempLangChkWord.toLowerCase()==subLinkWord.toLowerCase()) {
				chkSubInt++;
				if (chkSubInt==1) {
					tempInt = i;
				}
			}			
		} else {
			tempSplSubLinkWord = tempSubLinkWord.split("_");
			subLinkWord = tempSplSubLinkWord[0];
			if (tempLangChkWord.toLowerCase()==subLinkWord.toLowerCase()) {
				chkSubInt++;
				if (Number(tempSplSubLinkWord[1]) == chkSubInt) {
					tempInt = i;
				}
			}			
		}		
	}
	splKeyTerm = _global.arrKeyTermBank[tempInt].split("SPLDATA");
	_root.m_c.title_english = splKeyTerm[1];
	_root.m_c.title_spanish = splKeyTerm[2];
	splKeyTermDesc = splKeyTerm[3].split("~LNG~");
	//English Sub Link
	tempDescription = splKeyTermDesc[0];
	tempSubLink = splKeyTerm[4];
	if (tempSubLink!="" && tempSubLink!=undefined && tempSubLink!="undefined") {
		splTempSubLink = new Array();
		splTempSubLink = tempSubLink.split("~");
		for (i=0;i<splTempSubLink.length;i++) {
			splTempLinkWord = splTempSubLink[i].split(",");
			splTempDesc = tempDescription.split(splTempLinkWord[0]);
			tempLinkVal = "";
			for (j=0;j<splTempDesc.length;j++) {
				if (j==0) {
					if (splTempDesc[j]=="") {
						tempLinkVal = "<A HREF='asfunction:doGetSubLink," + splTempLinkWord[1] + "~English'><FONT COLOR='#006600'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>"
					} else {
							tempLinkVal = splTempDesc[j];
					}
				} else  {
				if (j==1) {
					if (splTempDesc[j-1]=="") {
						tempLinkVal = tempLinkVal + splTempDesc[j];
					} else {
						tempLinkVal = tempLinkVal + "<A HREF='asfunction:doGetSubLink," + splTempLinkWord[1] + "~English'><FONT COLOR='#006600'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>" + splTempDesc[j];						
					}
				} else {
					tempLinkVal = tempLinkVal + splTempLinkWord[0] + splTempDesc[j];
				}}
			}
			tempDescription = tempLinkVal;
		}
		splTempSpace = tempDescription.split("</A> <A");
		tempFinalKTDef = "";
		for (i=0;i<splTempSpace.length;i++) {
			if (tempFinalKTDef=="") {
				tempFinalKTDef = splTempSpace[i];
			} else {
				tempFinalKTDef = tempFinalKTDef + "</A>&nbsp;<A" + splTempSpace[i];
			}
		}
		_root.m_c.Keycontent_english.htmlText = tempFinalKTDef;
	} else {
		_root.m_c.Keycontent_english.htmlText = tempDescription;
	}
	
	//Spanish Sub Link
	tempDescription = splKeyTermDesc[1];
	tempSubLink = splKeyTerm[5];
	if (tempSubLink!="" && tempSubLink!=undefined && tempSubLink!="undefined") {
		splTempSubLink = new Array();
		splTempSubLink = tempSubLink.split("~");
		for (i=0;i<splTempSubLink.length;i++) {
			splTempLinkWord = splTempSubLink[i].split(",");
			splTempDesc = tempDescription.split(splTempLinkWord[0]);
			tempLinkVal = "";
			for (j=0;j<splTempDesc.length;j++) {
				if (j==0) {
					if (splTempDesc[j]=="") {
						tempLinkVal = "<A HREF='asfunction:doGetSubLink," + splTempLinkWord[1] + "~Spanish'><FONT COLOR='#006600'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>"
					} else {
							tempLinkVal = splTempDesc[j];
					}
				} else  {
				if (j==1) {
					if (splTempDesc[j-1]=="") {
						tempLinkVal = tempLinkVal + splTempDesc[j];
					} else {
						tempLinkVal = tempLinkVal + "<A HREF='asfunction:doGetSubLink," + splTempLinkWord[1] + "~Spanish'><FONT COLOR='#006600'><U><B>" + splTempLinkWord[0] + "</B></U></FONT></A>" + splTempDesc[j];						
					}
				} else {
					tempLinkVal = tempLinkVal + splTempLinkWord[0] + splTempDesc[j];
				}}
			}
			tempDescription = tempLinkVal;
		}
		splTempSpace = tempDescription.split("</A> <A");
		tempFinalKTDef = "";
		for (i=0;i<splTempSpace.length;i++) {
			if (tempFinalKTDef=="") {
				tempFinalKTDef = splTempSpace[i];
			} else {
				tempFinalKTDef = tempFinalKTDef + "</A>&nbsp;<A" + splTempSpace[i];
			}
		}		
		_root.m_c.Keycontent_spanish.htmlText = tempFinalKTDef;
	} else {
		_root.m_c.Keycontent_spanish.htmlText = tempDescription;
	}
	
	exampleSwfFileName = _global.xmlPath+"DIG/" + splKeyTerm[6].toLowerCase();
	_root.m_c.keyterm_diagram.unloadMovie();
	_root.m_c.keyterm_diagram.loadMovie(exampleSwfFileName, 6);

    	tempSplSndKTFName = splKeyTerm[6].toLowerCase().split(".");
    	SndKTEFName = _global.xmlPath+"EAD/" + tempSplSndKTFName[0] + ".mp3";
    	SndKTSFName = _global.xmlPath+"SAD/" + tempSplSndKTFName[0] + ".mp3";
    	
    //Begin Click Project Individual for MLC
	if (_root.dtfClicks.text.toUpperCase()=="ON" && _root.boolMcVisible==false) {
		_root.strIndividualButttonClickType = "KTHL";
		//strTempIndividualClickDesc = _root.m_c.title_english + "~" + _root.m_c.Keycontent_english.text + "~" + _root.m_c.title_spanish + "~" + _root.m_c.Keycontent_spanish.text;
		strTempIndividualClickDesc = _root.m_c.title_english + "~" + _root.m_c.title_spanish;
		strTempIndividualClickDesc = strTempIndividualClickDesc.split("&").join("ANDSYM");
		_root.strIndividualClickDesc = strTempIndividualClickDesc;
		trace(_root.strIndividualClickDesc);
		_root.strFinalClickURL = "";
		_root.Send_Click_Report_Mc.gotoAndPlay(6);
	}	
	//End Click Project Individual for MLC    	
}

function doSKTClose() {
	_global.Play=true;
	_global.Pause=false;
	_global.CompClick="";
	_root.m_c._visible=false;
	_global.engKTSoundMp3.stop();
}

function doCloseApp() {
	getURL("javascript:parent.close();");
}

_root.onEnterFrame = function() {
	_root.animation_mc_preload.stop();
	if (_global.showLoading_Spanish) {
		if (_global.spanSoundMp3.position>0) {
			_global.showLoading_Spanish = false;
			_root.MCtxtWarnSAText._visible = false
			_root.MCtxtWarnSAText._alpha = 0
			
		} else {
			_root.MCtxtWarnSAText._visible = true
			_root.MCtxtWarnSAText._alpha = 100
			
		}

	} else {
		_root.MCtxtWarnSAText._visible = false
		_root.MCtxtWarnSAText._alpha = 0
		
	}
	
	if(_global.newTitleTag==true) {
		_root.animation_mc.Mc_Page_Title._visible=false;
		_root.animation_mc["Mc_Page_Title  "]._visible=false;
		_root.animation_mc.animation.Mc_Page_Title._visible=false;
		_root.animation_mc.animation["Mc_Page_Title  "]._visible=false;
		
	}
	
	//Final Quiz Audio ON OFF Begin
	if (_global.playSwfFileName.indexOf("FQ02")!=-1 || _global.playSwfFileName.indexOf("FQ03")!=-1) {
		if (_global.strFQTempLabel!=undefined && "Q" + Number(_root.animation_mc.animation._currentframe-1).toString()!=_global.strFQTempLabel || _root.animation_mc.animation.Mc_Finish._visible==true) {
			_global.strFQTempLabel = "Q" + Number(_root.animation_mc.animation._currentframe-1).toString();
			_global.sndFQSound.stop();
			_global.sndFQSound.unLoad();
			_root.animation_mc.animation.Mc_Quiz_Audio.gotoAndStop(1);
			for (i=1; i<=4; i++) {
				eval("_root.animation_mc.animation.Mc_Quiz_Audio_" + i).gotoAndStop(1);
			}
		}
	}
	//Final Quiz Audio ON OFF End	
	
	/*if(_global.newTitleTag==true) {
		_global.mcCurrentMap = "Map_Elm_Normal";
	} else {
		_global.mcCurrentMap = "Map_Elm_Dancing";
	}*/
}


function doCheckSpanishAudio() {
	if (_root.dtfSPANISH.text.toUpperCase() == "ON") {
		if (_global.spanSound != true) {
			//_global.checkSpanishAudio = 1;
			//_root.Mc_Check_SPAudio.gotoAndStop(15);
			if (_global.newTitleTag==true) {
				if (_global.sectionNumber>=0 && _global.sectionNumber<_global.arrayTotalSectionDetails.length) {
					tempString = _global.playSwfFileName.substring(_global.playSwfFileName.length-6, _global.playSwfFileName.length);
					if (tempString.toUpperCase()!="01.SWF") {
						_root.SA._visible = true;
						_root.EA._visible = true;
						_root.SA._alpha = 100;
						_root.EA._alpha = 100;
					} else {
						_root.SA._visible = false;
						_root.EA._visible = false;
						_root.SA._alpha = 0;
						_root.EA._alpha = 0;
					}
				} else {
					_root.SA._visible = false;
					_root.EA._visible = false;
					_root.SA._alpha = 0;
					_root.EA._alpha = 0;
				}
			} else {
				if (_global.sectionNumber>=1 && _global.sectionNumber<_global.arrayTotalSectionDetails.length) {
					tempString = _global.playSwfFileName.substring(_global.playSwfFileName.length-6, _global.playSwfFileName.length);
					if (tempString.toUpperCase()!="01.SWF") {
						_root.SA._visible = true;
						_root.EA._visible = true;
						_root.SA._alpha = 100;
						_root.EA._alpha = 100;
					} else {
						_root.SA._visible = false;
						_root.EA._visible = false;
						_root.SA._alpha = 0;
						_root.EA._alpha = 0;
					}
				} else {
					_root.SA._visible = false;
					_root.EA._visible = false;
					_root.SA._alpha = 0;
					_root.EA._alpha = 0;
				}			
			}
		}
	} else {
		_root.SA._visible = false;
		_root.EA._visible = false;
		_root.SA._alpha = 0;
		_root.EA._alpha = 0;
	}
}


/*
//Server Script
//**************************************************************************************************************************************
if (_root.preloader_mc.tempPerc>=100&&_root.dtfSPANISH.text!=""&&_root.dtfSPANISH.text!=undefined&&_root.dtfSPANISH.text!="undefined") {
	gotoAndPlay("start");
}

if (_root.preloader_mc.tempPerc>=100&&_root.dtfSPANISH.text==""||_root.dtfSPANISH.text==undefined||_root.dtfSPANISH.text=="undefined") {
	_root.stop();
	_root.bar._visible=false;
	_root.dtfLOAD._visible=false;
	_root.ShowLogin_Error_Mc._visible=true;
	_root.ShowLogin_Error_Mc.gotoAndStop(2);
}

if (_root.dtfSPANISH.text==""||_root.dtfSPANISH.text==undefined||_root.dtfSPANISH.text=="undefined") {
	_global.MainFilePath = "~*&!@#$%^()_+|";
	_global.xmlPath = "~*&!@#$%^()_+|";
	_global.formulasPath = "~*&!@#$%^()_+|";
} else {
	_global.MainFilePath = _global.ServerRoot+"/";
	_global.xmlPath = _global.ServerRoot+"/HELP_KEYTERMS/KT/ELEMENTARY/";
	_global.formulasPath = _global.ServerRoot+"/HELP_FORMULAS/ELEMENTARY/";
}

if (_root.Report_URL==""||_root.Report_URL=="undefined"||_root.Report_URL==undefined) {
	_root.getBookMark();
}
if (_root.Student_Help_URL==""||_root.Student_Help_URL=="undefined"||_root.Student_Help_URL==undefined) {
	_root.BtnHelp._visible=false;
}
//**************************************************************************************************************************************
*/


//Local Script
//**************************************************************************************************************************************
if (_root.getBytesLoaded()>=_root.getBytesTotal()) {
	gotoAndPlay("start");
} else {
	loadInt = int((_root._root.getBytesLoaded()/_root.getBytesTotal()));
	load = loadInt+"% Loaded";
	_root.bar.gotoAndStop(int(loadInt));
}
_global.MainFilePath = _global.ServerRoot+"/";
_global.xmlPath = _global.ServerRoot+"/HELP_KEYTERMS/KT/ELEMENTARY/";
_global.formulasPath = _global.ServerRoot+"/HELP_FORMULAS/ELEMENTARY/";
//**************************************************************************************************************************************
