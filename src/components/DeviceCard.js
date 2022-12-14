import React from 'react';
import { PubSub } from 'aws-amplify';
import RealtimeLineChart from './RealtimeLineChart';
import {tempRadialChartOption, humRadialChartOption, pmRadialChartOption, soundRadialStroke, vibrationRadialStroke} from './ChartOptions';
import ReactApexChart from "react-apexcharts";

import Box from '@mui/material/Box';

import { Button, Collapse, Divider, IconButton, ToggleButton } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import {styled} from '@mui/material/styles';
import {HistoryButton} from './HistoryButton';

import Grid from '@mui/material/Grid';
import {flushSync} from 'react-dom';

// Time range real-time chart
const TIME_RANGE_IN_MILLISECONDS = 30 * 1000;

// Styling expanding button
const ExpandMore = styled((props)=>{
	const {expand, ...other} = props;
	return <IconButton {...other}/>;
})(({theme, expand})=>({
	transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
	marginLeft: 'auto',
	transition: theme.transitions.create('transform',{
		duration: theme.transitions.duration.shortest,
	})
}));

	
class DeviceCard extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			deviceID: props.deviceID,
			currentTemp: [0], tempDatalist: [{name: "Temperature", data: []}],
			currentHum: [0], humDatalist: [{name: "Humidity", data: []}],
			currentPM25: [0], pmDatalist: [{name: "PM2.5", data: []}],
			currentSound: [0],
			currentVibration: [0],
      IoT_payload_object: {}, IoT_device_data: {},
			TempExpanded: true, HumExpanded: true, PM25Expanded: true, SoundExpanded: true
    };
		
		// this.handleTempExpandClick = this.handleTempExpandClick.bind(this);
		// this.handleHumExpandClick = this.handleHumExpandClick.bind(this);
		// this.handlePMExpandClick = this.handlePMExpandClick.bind(this);
		// this.handleSoundExpandClick = this.handleSoundExpandClick.bind(this);
		
		this.handlePowerOffClick = this.handlePowerOffClick.bind(this);
	}
	
	
	componentDidMount(){

    // Handle MQTT payload and trigger rerendering with setstate
		let device_data_publish = "aws/things/" +  "construction_esp32" + "/shadow/update" + "/"+ this.state.deviceID
		// let device_data_publish = "aws/things/" +  "construction_esp32" + "/shadow/update"
		PubSub.subscribe(device_data_publish).subscribe({
			next: data => 
			{
			// Convert packet to string
			let message = '';
      message = JSON.stringify(data);
      // Grep message content and convert to object
      let message_object = JSON.parse(message.substring(message.indexOf('value')+7).slice(0,-1));
			
			// Loop through data array
			// Has to be nested inside subscribe as an asynchronous call, otherwise, won't trigger rerendering chart.
			// Push device data to each type of charts
			this.setState({IoT_payload_object:message_object});
			if(message_object.state.reported.data[0].deviceId ===  this.state.deviceID)						// ! REMEMBER TO REMOVE THIS
			{
				for (let i = 0; i < message_object.state.reported.data.length; i++){
					this.setState({IoT_device_data: message_object.state.reported.data[i]});
					this.setState({current_datalist_timestamp: message_object.state.reported.data[i].data_timestamp});
					setTimeout(()=>{
						this.setState({deviceID: message_object.state.reported.data[0].deviceId})
						this.setState({currentTemp: [message_object.state.reported.data[i].temp]});
						this.setState({currentHum: [message_object.state.reported.data[i].humid]});
						this.setState({currentPM25: [message_object.state.reported.data[i].pm25]});
						this.setState({currentSound: [message_object.state.reported.data[i].sound]});
						this.setState({currentVibration: [message_object.state.reported.data[i].vib]});
						this.setState({tempDatalist: this.setDataList(this.state.tempDatalist, message_object.state.reported.data[i].temp)});
						this.setState({humDatalist: this.setDataList(this.state.humDatalist,message_object.state.reported.data[i].humid)});
						this.setState({pmDatalist: this.setDataList(this.state.pmDatalist,message_object.state.reported.data[i].pm25)});
						// The line below is really important. setTimeout is a non-blocking.
					// }, i*1000);
					}, i*900);
				}
				console.log(message_object);
				
			}
			},
      error: error => console.error(error),
      close: () => console.log('Done'),
  });
	
			
  }
  
  setDataList(attributeDatalist, payloadAtrributeData){
		let newDatalist = [];
    attributeDatalist.forEach((e)=>{
			let currentData = e.data;
			currentData = this.addData(currentData, payloadAtrributeData);
			newDatalist.push({name: e.name, data: currentData})
    })
		return newDatalist;
  }
	
	addData(currentData, payloadAttributeData){
		return[...currentData,  {x: new Date(), y: payloadAttributeData}];
	}
	
	handlePowerOffClick(){
		PubSub.publish('aws/things/construction_esp32/command/' + this.state.deviceID, {msg: 'OFF'});
	}
	
	// handleTempExpandClick(){this.setState(prevState => ({TempExpanded: !prevState.TempExpanded}));}
	// handleHumExpandClick(){this.setState(prevState => ({HumExpanded: !prevState.HumExpanded}));}
	// handlePMExpandClick(){this.setState(prevState => ({PM25Expanded: !prevState.PM25Expanded}));}
	// handleSoundExpandClick(){this.setState(prevState => ({SoundExpanded: !prevState.SoundExpanded}));}
	
	render () {
		return (
			<Grid item xs={6} md={8}>
				<Box className="DeviceCard" sx={{maxWidth: 350}}>
				<Box style={{backgroundColor: '#172153',
				width: '340px', height: '45px',
				display: 'flex', flexDirection: 'row', 
				alignItems: 'center', justifyContent: 'center', gap: '95px', padding: '5px'}}>
					<div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
						<div style={{color:"white", fontWeight:"bold"}}>  {this.state.deviceID} </div>
						<div style={{color:"white", fontSize: "14px"}}> Building 21 </div>
					</div>
					<div style={{color:"lime", fontWeight:"bold"}}> Normal </div>
				</Box>
				
				<Divider style={{width:'100%'}}></Divider>
				<Box className="tempCharts" display="flex" flexDirection="row" alignItems="flex-end" justifyContent="flex-end" marginBottom="5px">
					<Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
						<div style={{fontWeight:"bold", color:"#454545", marginTop:"7px", marginBottom:"2px"}}> Temperature</div>
						<ReactApexChart options={tempRadialChartOption} series={this.state.currentTemp} type="radialBar" height={120} width={80}/>
					</Box>
						<div className="LineChart">
							<RealtimeLineChart
								dataList={this.state.tempDatalist}
								range={TIME_RANGE_IN_MILLISECONDS}/>
						</div>
				</Box>
				
				<Divider style={{width:'100%'}}></Divider>
				<Box className="humCharts" display="flex" flexDirection="row" alignItems="flex-end" justifyContent="flex-end" marginBottom="5px">
					<Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
						<div style={{fontWeight:"bold",color:"#454545", marginTop:"7px", marginBottom:"2px"}}> Humidity</div>
						<ReactApexChart options={humRadialChartOption} series={this.state.currentHum} type="radialBar" height={120} width={80}/>
					</Box>
						<div className="LineChart">
							<RealtimeLineChart
								dataList={this.state.humDatalist}
								range={TIME_RANGE_IN_MILLISECONDS}
								/>
						</div>
				</Box>
				
				<Divider style={{width:'100%'}}></Divider>
				<Box className="pm25Charts" display="flex" flexDirection="row" alignItems="flex-end" justifyContent="flex-end" marginBottom="5px">
					<Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
						<div style={{fontWeight:"bold", color:"#454545", marginTop:"7px", marginBottom:"2px"}}>PM2.5</div>
						<ReactApexChart options={pmRadialChartOption} series={this.state.currentPM25} type="radialBar" height={120} width={80}/>
					</Box>
					<div className="LineChart">
						<RealtimeLineChart
							dataList={this.state.pmDatalist}
							range={TIME_RANGE_IN_MILLISECONDS}
							/>
					</div>
				</Box>
				
				<Divider style={{width:'100%'}}></Divider>
				<Box className="soundAndVibChart" display="flex" flexDirection="row" alignItems="center" justifyContent="space-evenly" gap="15px">
					<Box display="flex" flexDirection="column" alignItems="center" justifyContent="flex-end">
						<div style={{fontWeight:"bold", color:"#454545", marginTop:"7px" }}>Acoustic</div>
						<Box maxHeight="90px" overflow="hidden">
							<ReactApexChart options={soundRadialStroke} series={this.state.currentSound} type="radialBar" height={220} width={150}/>
						</Box>
					</Box>
					<Box display="flex" flexDirection="column" alignItems="center" justifyContent="flex-end">
						<div style={{fontWeight:"bold", color:"#454545", marginTop:"7px"}}>Vibration</div>
						<Box maxHeight="90px" overflow="hidden">
							<ReactApexChart options={vibrationRadialStroke} series={this.state.currentVibration} type="radialBar" height={220} width={150}/>
						</Box>
					</Box>
				</Box>
				
				<Divider style={{width:'100%'}}></Divider>
				<Box className="deviceControl"
				style={{backgroundColor: 'white', width: '300px', 
				height: '45px', display: 'flex', flexDirection: 'row', 
				alignItems: 'center', justifyContent: 'center', gap: '90px'}}>
					<IconButton>
						<SettingsIcon/>
					</IconButton>
					<HistoryButton deviceID={this.state.deviceID}/>
					<Box style={{border: "1px solid #000", borderColor:"gray", borderRadius:30, overflow: "hidden", height: 30, width: 30, display: "flex", alignItems: "center", justifyContent: "center"}}>
					<IconButton onClick={this.handlePowerOffClick}>
						<PowerSettingsNewIcon/>
					</IconButton>
					</Box>
				</Box>
			</Box>
				
			</Grid>
		);
	}
}

export default DeviceCard;