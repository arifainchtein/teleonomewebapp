//
// the ports for the exoZeroNetwork
//
var EXOZERO_PULSE_PORT=5563;
var EXOZERO_MNEMOSYNE_MANAGER_PORT=5564;
	
	
var TELEONOME_STATUS_ACTIVE = "OK";
var TELEONOME_STATUS_DISCOVERED = "Discovered";
var TELEONOME_STATUS_MISSED_PULSE = "Missed Pulse";
var TELEONOME_STATUS_CAUTION = "Caution";
var TELEONOME_STATUS_ALERT = "Alert";
//
// if the status is Alert, the teleonome will put a Alert Message
//
var TELEONOME_STATUS_ALERT_MESSAGE = "Alert Message";

//
// the status detail of a Teleonome
//
var TELEONOME_OPERATION_MODE_UNKNOWN = "Unknown";
var TELEONOME_OPERATION_MODE_NORMAL = "Normal";
var TELEONOME_OPERATION_MODE_NO_WIFI = "No WiFi";
var TELEONOME_OPERATION_MODE_HIBERNATION = "Hibernation";    
var TELEONOME_OPERATION_NOT_AVAILABLE = "Not Available";

//
// the processor related variables
//
var DENEOWRD_TYPE_PROCESSOR_POINTER = "Processor Pointer";
var DENE_TYPE_PROCESSOR = "Processor";

//
// the different kinds of deneword operations
//
var DENE_TYPE_DENEWORD_OPERATION_EXPRESSION_EVALUATION = "Expression Evaluation";
var DENE_TYPE_DENEWORD_OPERATION_EXPRESSION_SWITCH = "Expression Switch";

//
// the value of the teleonome Identity
//
var DENEWORD_TYPE_INITIAL_IDENTITY_MODE = "Initial Identity Mode";
var DENEWORD_TYPE_CURRENT_IDENTITY_MODE = "Current Identity Mode";
var TELEONOME_IDENTITY_LABEL = "Identity";



var TELEONOME_IDENTITY_SELF = "Self";
var TELEONOME_IDENTITY_ORGANISM = "Organism";
//
// the data type for the values coming from Arduino
//
var DATATYPE_DOUBLE = "double";
var DATATYPE_INTEGER = "int";
var DATATYPE_STRING = "String";
var DATATYPE_JSONARRAY = "JSONArray";
var DATATYPE_IMAGE_FILE = "Image File";
var DATATYPE_AUDIO_FILE = "Audio File";
var DATATYPE_VIDEO_FILE = "Video File";

var DATATYPE_DENE_POINTER = "Dene Pointer";
var DATATYPE_TIMESTAMP = "Timestamp";
var DATATYPE_TIMESTAMP_MILLISECONDS = "Timestamp Milliseconds";

var DATATYPE_LONG = "long";
var DATATYPE_FILE="File";
var DATATYPE_TIME_SERIES="Time Series";
var TIME_SERIES_MINIMUM="Minimum";
var TIME_SERIES_MAXIMUM="Maximum";
var TIME_SERIES_AVERAGE="Average";

//
// the different types of Denes
//
var DENE_TYPE_SENSOR = "Sensor";

var DENE_TYPE_SENSOR_VALUE = "Sensor Value";
var DENE_TYPE_SENSOR_VALUE_DEFINITION = "Sensor Value Definition";
var SENSOR_VALUE_RANGE_MAXIMUM = "Range Maximum";
var SENSOR_VALUE_RANGE_MINIMUM = "Range Minimum";
var SENSOR_CURRENT_VALUE = "Current Value";



var DENE_TYPE_ON_START_ACTION = "On Start Action";
var DENE_TYPE_ON_START_SENSOR = "On Start Sensor";


var DENE_TYPE_ACTUATOR = "Actuator";
var DENE_TYPE_REPORT = "Report";
var DENE_TYPE_MICROCONTROLLER = "Microcontroller";
var DENE_TYPE_MICROCONTROLLER_CONFIG_PARAMETER_LIST = "Microcontroller Config Parameter List";
var DENE_TYPE_MICROCONTROLLER_CONFIG_PARAMETER = "Microcontroller Config Parameter";

var DENE_TYPE_VITAL = "Vital";
var DENE_TYPE_CODON_ELEMENT = "Codon Element";
var DENE_TYPE_ON_LOAD_MUTATION = "On Load";
var DENE_TYPE_DENEWORD_CARRIER= "DeneWord Carrier";

var DENE_TYPE_ACTION_LIST= "Action List";

var DENE_TYPE_HUMAN_INTERFACE_STATE_VARIABLES= "Human Interface State Variables";
var DENE_TYPE_ACTUATOR_ACTION_PROCESSING="Actuator Action Processing";

var DENE_TYPE_COMPONENT= "Component";
var DENE_TYPE_COMPONENT_TYPE= "Component Type";
var DENE_TYPE_COMPONENT_PROVIDER= "Component Provider";
var DENE_TYPE_COMPONENT_GROUP= "Component Group";
var DENE_TYPE_COMPONENT_LIST= "Component List";

var DENE_TYPE_COMPONENT_ELEMENT= "Component Group Elements List";
var DENEWORD_TYPE_COMPONENT_GROUP_LIST= "Component Group Elements List";
var DENEWORD_TYPE_COMPONENT_PROVIDER= "Component Provider";

var DENEWORD_ACTUATOR_COMMAND_CODE_TRUE_EXPRESSION= "Actuator Command Code True Expression";
var DENEWORD_ACTUATOR_COMMAND_CODE_FALSE_EXPRESSION= "Actuator Command Code False Expression";
var DENE_TYPE_CONDITION_DENOMIC_OPERATION="Condition Denomic Operation";
//
// the different types of Denomic Operatins
var DENOMIC_ELEMENT_EXISTS="Denomic Element Exists";
var DENOMIC_ELEMENT_DOES_NOT_EXISTS="Denomic Element Does Not Exists";
var CONDITION_DENOMIC_OPERATION_DATA_SOURCE="Data Source";
var CONDITION_DENOMIC_OPERATION="Operation";
var DENE_TYPE_DENOMIC_OPERATION="Denomic Operation";

//
// the different Denes
//
var DENE_VITAL = "Vital";
var DENE_OPERATIONAL_PARAMETERS_THRESHOLDS = "Operational Parameters Thresholds";
var DENE_USB_DEVICES="USB Devices";
var DENE_PROCESSOR_INFO="Processor Info";
var DENE_COMPUTER_INFO="Computer Info";
var DENE_OPERON_CONTROL="Operon Control";
//
// the different types of DeneChain
//
var DENECHAIN_OPERONS = "Operons";
var DENECHAIN_MEDULA = "Medula";
var DENECHAIN_ACTUATORS = "Actuators";
var DENECHAIN_SENSORS = "Sensors";    
var DENECHAIN_DESCRIPTIVE = "Descriptive";
var DENECHAIN_COMPONENTS = "Components";
var DENECHAIN_ANALYTICONS = "Analyticons";
var DENECHAIN_CONTROL_PARAMETERS = "Control Parameters";


var DENECHAIN_EXTERNAL_DATA = "External Data";
var DENECHAIN_ACTUATOR_LOGIC_PROCESSING ="Actuator Logic Processing";
var DENE_TYPE_ACTUATOR_DENE_OPERATION_EVALUATION_PROCESSING="Actuator Action Dene Operation Evaluation Processing";

var DENECHAIN_PATHOLOGY ="Pathology";
var DENECHAIN_MNEMOSYNE_PATHOLOGY ="Mnemosyne Pathology";
var DENECHAIN_MNEMOSYNE_PULSE ="Mnemosyne Pulse";

var DENECHAIN_HUMAN_INTERFACE = "Human Interface";

var DENECHAIN_OPERATIONAL_DATA ="Operational Data";
var DENECHAIN_SENSOR_DATA ="Sensor Data";

var DENECHAIN_DENE_INJECTION ="Dene Injections";
var DENECHAIN_DENEWORD_INJECTION ="DeneWord Injections";
var DENECHAIN_ACTIONS_TO_EXECUTE="Actions To Execute";
var DENECHAIN_MNEMOSYNE_OPERATIONS="Mnemosyne Operations";

var DENECHAIN_ORGANISM_CONFIGURATION="Organism Configuration";
var DENECHAIN_ORGANISM_STATUS="Organism Status";

//
// the different types of Nuclei
//
var NUCLEI_INTERNAL = "Internal";
var NUCLEI_PURPOSE = "Purpose";
var NUCLEI_MNEMOSYNE = "Mnemosyne";
var NUCLEI_HUMAN_INTERFACE = "Human Interface";


var VALUE_UNDEFINED = "Undefined";

//
// the Vital Dene DeneWords
//
var VITAL_DENEWORD_BASE_PULSE_FREQUENCY = "Base Pulse Frequency";
var VITAL_DENEWORD_TIMEZONE = "Timezone";
var VITAL_DENEWORD_INTER_SENSOR_READ_TIMEOUT_MILLISECONDS = "Inter Sensor Read Timeout Milliseconds";
var VITAL_DENEWORD_PERSIST_DATA="Persist Data";

//
// the command embedded as values
//
var COMMANDS_ELAPSED_TIME_STRING = "$ElapsedTimeString";
var COMMANDS_CURRENT_HOUR = "$Current_Hour";
var COMMANDS_PUBLISH_TELEONOME_PULSE="$Teleonome_Pulse";

var COMMANDS_CURRENT_DATE = "$Current_Date";
var COMMANDS_CURRENT_TIMESTAMP = "$Current_Timestamp";
var COMMANDS_CURRENT_TIMESTAMP_MILLIS = "$Current_Timestamp_Millis";
var COMMANDS_CURRENT_MINUTE_IN_THE_HOUR = "$Current_Minute_In_The_Hour";
var COMMANDS_CURRENT_HOUR_IN_DAY = "$Current_Hour_In_Day";
var COMMANDS_CURRENT_DAY_IN_WEEK = "$Current_Day_In_Week";
var COMMANDS_CURRENT_DAY_IN_MONTH = "$Current_Day_In_Month";
var COMMANDS_DATE_FOR_EXPORT_FILENAME="$Date_For_File_Export";

var CURRENT_TIMESTAMP_VARIABLE_NAME = "CurrentTime";


var COMMANDS_TIME_FOR_LCD = "$TimeForLCD";
var COMMANDS_DATE_FOR_LCD = "$DateForLCD";
var COMMANDS_IP_ADDRESS_FOR_LCD = "$IPForLCD";
var COMMANDS_SSID_FOR_LCD = "$SSIDLCD";

var COMMANDS_SET_MICROCONTROLLER_RTC = "$SetMicrocontrollerTime";
var COMMANDS_DO_NOTHING = "$DoNothing";
var COMMAND_MNEMOSYNE_LAST_DENE_POSITION="$Last_Dene_Position";
var COMMAND_MNEMOSYNE_PREVIOUS_TO_LAST_DENE_POSITION="$Previous_To_Last_Dene_Position";
var COMMAND_MNEMOSYNE_FIRST_POSITION="$First_Position";

var COMMANDS_PREVIOUS_PULSE_VALUE = "$Previous_Pulse_Value";
var COMMANDS_PREVIOUS_PULSE_TIMESTAMP = "$Previous_Pulse_Timestamp";
var COMMANDS_PREVIOUS_PULSE_MILLIS = "$Previous_Pulse_Millis";
var COMMAND_LOCATION_WEBSERVER_ROOT="$Webserver_Root";

var COMMAND_REBOOT="$Reboot";
var COMMAND_SHUTDOWN="$Shutdown";
var COMMAND_REBOOT_TEXT="Reboot";
var COMMAND_SHUTDOWN_TEXT="Shutdown";

var SHUTDOWN_ACTION="Shutdown Action";

var COMMAND_SHUTDOWN_ENABLE_HOST="Shutdown Enable Host";
var COMMAND_SHUTDOWN_ENABLE_NETWORK="Shutdown Enable Network";
var COMMAND_REBOOT_ENABLE_HOST="Reboot Enable Host";
var COMMAND_REBOOT_ENABLE_NETWORK="Reboot Enable Network";
var COMMAND_KILL_PULSE="KillPulse";
var COMMAND_CONFIRM_REBOOT="ConfirmReboot";
var COMMAND_CONFIRM_SHUTDOWN="ConfirmShutdown";
var COMMAND_START_PULSE="StartPulse";
var COMMAND_FAULT="Fault";


var COMMAND_CONFIRM_STOP_PULSE="ConfirmKillPulse";
var COMMAND_REBOOTING="Rebooting";
var COMMAND_SHUTINGDOWN="Shutingdown";
var COMMAND_STOPPING_PULSE="StoppingPulse";
var COMMAND_STATE_MUTATION_PAYLOAD_INJECTION = "State Mutation Payload Injection";
var CAMERA_TIMESTAMP_FILENAME_FORMAT="dd-MM-yyyy_HHmm";

//
// the mutation actions dene types
//
var MUTATION_COMMAND_SET_DENEWORD = "Set DeneWord";
var MUTATION_COMMAND_TARGET = "Target";
var MUTATION_COMMAND_DENEWORD_NAME = "Mutation Name";
var MUTATION_COMMAND_DENEWORD_VALUE = "Mutation Value";
//
// the type of mutatins according to when they get executed
var MUTATION_EXECUTION_MODE_IMMEDIATE="Immediate";
var MUTATION_EXECUTION_MODE_NORMAL="Normal";

var MUTATION_PROCESSING_LOGIC_DENE_CHAIN_NAME="Mutation Processing Logic";


//
// the mutation type
//
var MUTATION_TYPE_STATE="State";
var MUTATION_TYPE_STRUCTURE="Structure";
var MUTATION_TYPE_ATTRIBUTE = "Mutation Type";

var MUTATION_INVOCATION_MODE_ATTRIBUTE="Invocation Mode";
var MUTATION_INVOCATION_MODE_EVENT="Event";
var MUTATION_INVOCATION_MODE_TIME = "Time";


var DENE_IDENTITY_SWITCH_CONTROL_PARAMETERS = "Identity Switch Control Parameters";
var DENE_TYPE_IDENTITY_SWITCH_EVENT = "Identity Switch Event";
var IDENTITY_SWITCH_EVENT_TIMESTAMP = "Identity Switch Event Timestamp";
var IDENTITY_SWITCH_EVENT_MILLISECONDS =  "Identity Switch Event Milliseconds";

var DENE_TYPE_EXOGENUS_METAMORPHOSIS_EVENT = "Exogenous Metamorphosis Event";
var DENEWORD_MAXIMUM_NUMBER_REBOOTS_BEFORE_IDENTITY_SWITCH = "Maximum Number Reboots Before Identity Switch";
var DENEWORD_CURRENT_NUMBER_REBOOTS_BEFORE_METAMORPHOSIS = "Current Number Reboots Before Metamorphosis";
var DENEWORD_CURRENT_NUMBER_REBOOTS_BEFORE_IDENTITY_SWITCH = "Current Number Reboots Before Identity Switch";
var DENEWORD_IDENTITY_SWITCH_EVENTS_MNEMOSYNE_DESTINATION = "Identity Switch Events Mnemosyne Destination";
var METAMORPHOSIS_EVENT_TIMESTAMP = "Metamorphosis Event Timestamp";
var METAMORPHOSIS_EVENT_MILLISECONDS =  "Metamorphosis Event Milliseconds";


//
// Deneword types
//
var DENEWORD_TYPE_ACTION="Action";
var DENEWORD_TYPE_CURRENT_PULSE="Current Pulse";
var DENEWORD_TYPE_CURRENT_PULSE_FREQUENCY="Current Pulse Frequency";
var DENEWORD_TYPE_CURRENT_PULSE_GENERATION_DURATION="Current Pulse Generation Duration";
var DENEWORD_TYPE_CONFIGURATION_PARAMETER="Configuration Parameter";

var DENEWORD_TYPE_BASE_PULSE_FREQUENCY="Base Pulse Frequency";
var DENEWORD_TYPE_NUMBER_PULSES_BEFORE_LATE="Number of Pulses Before Late";

var DENEWORD_TYPE_COMPONENT_POINTER = "Component Pointer";
var DENEWORD_TYPE_ACTUATOR_CONDITION_POINTER = "Actuator Condition Pointer";
var DENEWORD_TYPE_CONDITION_VARIABLE_POINTER = "Condition Variable Pointer";
var DENEWORD_TYPE_SENSOR_VALUE = "Sensor Value";
var DENEWORD_TYPE_UPDATE_DENEWORD_VALUE = "Update DeneWord Value";
var DENEWORD_TYPE_APPEND_DENEWORD_VALUE = "Append DeneWord Value";

var DENEWORD_TYPE_FIRMWARE_COMMAND_POINTER = "Firmware Command Pointer";
var DENEWORD_TYPE_FIRMWARE_COMMAND = "Firmware Command";
var DENEWORD_TYPE_SENSOR_MICROCONTROLLER_POINTER = "Sensor Microcontroller Pointer";
var DENEWORD_TYPE_ACTUATOR_MICROCONTROLLER_POINTER = "Actuator Microcontroller Pointer";
var DENEWORD_TYPE_ACTUATOR_POINTER = "Actuator Pointer";
var DENEWORD_TYPE_ACTION_SUCCESS_TASK_TRUE_EXPRESSION="Action Success Tasks True Expression";
var DENEWORD_TYPE_ACTION_SUCCESS_TASK_FALSE_EXPRESSION="Action Success Tasks False Expression";
var DENEWORD_TYPE_MNEMOSYNE_OPERATION_FALSE_EXPRESSION="Mnemosyne Operations False Expression";
var DENEWORD_TYPE_MNEMOSYNE_OPERATION_TRUE_EXPRESSION="Mnemosyne Operations True Expression";
var DENEWORD_TYPE_MNEMOSYNE_OPERATION="Mnemosyne Operation";
var DENEWORD_TYPE_DENEWORD_EXPORT_POINTER="Export DeneWord Pointer";
var DENEWORD_TYPE_DENEWORD_EXPORT_COLUMN_POSITION="Export DeneWord Column Position";
var EXPORT_OPERATION_CREATE="Export Create";
var EXPORT_OPERATION_APPEND="Export Append";
var DENEWORD_PERSIST_ORGANISM_PULSE="Persist Organism Pulse";
var DENEWORD_PERSIST_PULSE="Persist Pulse";
var ACTION_SUCCESS_TASK_LABEL = "ActionSuccessTasks";
var MNEMOSYNE_OPERATION_INDEX_LABEL = "Mnemosyne Operation Index";
var DENE_TYPE_MNEMOSYNE_OPERATION_UPDATE_TIMESERIES_COUNTER="Mnemosyne Update Time Series Counter";
var DENE_TYPE_MNEMOSYNE_OPERATION_UPDATE_COUNTER="Mnemosyne Update Counter";
var DENEWORD_MNEMOSYNE_COUNTER="Counter";
var DENE_TYPE_MNEMOSYNE_OPERATION_RESET_COUNTER="Mnemosyne Reset Counter";
var MNEMOSYNE_DENE_WPS_CYCLE_PULSE_COUNT="WPS Cycle Pulse Count";
var DENEWORD_TYPE_MNEMOSYNE_OPERATION_COUNTER_POINTER="Counter Pointer";
var DENEWORD_TYPE_COUNTER_LIMIT="Counter Limit";
var DENEWORD_TYPE_COUNTER_INCREMENT="Counter Increment";

var MNEMOSYNE_PRUNNING_STRATEGY_RESET="Reset";
var MNEMOSYNE_PRUNNING_STRATEGY_ERASE="Erase";
var MNEMOSYNE_PRUNNING_STRATEGY="Mnemosyne Prunning Strategy";
var DENEWORD_TYPE_DATA_SOURCE_POINTER="Data Source Pointer";

var DENEWORD_TYPE_TIMESERIES_DATA_SOURCE_POINTER="Time Series Data Source Pointer";
var DENEWORD_TYPE_TIMESERIES_COUNTER_LIMIT="Time Series Counter Limit";
var DENEWORD_TYPE_TIMESERIES_DATA_POINTER="Time Series Data Pointer";
var DENEWORD_TYPE_TIMESERIES_COUNTER_POINTER="Time Series Counter Pointer";

var DENEWORD_TYPE_TIMESERIES_ELEMENT_SELECTOR="Time Series Element Selector";
var DENE_TYPE_MNEMOSYNE_OPERATION_COPY_TIMESERIES_ELEMENT_TO_TIMESERIES="Mnemosyne Copy Time Series Element to Time Series";

var DENE_TYPE_MNEMOSYNE_OPERATION_COPY_TIMESERIES_ELEMENT_TO_TIMESERIES="Mnemosyne Copy Time Series Element to Time Series";
var DENE_TYPE_MNEMOSYNE_OPERATION_COPY_TIMESERIES_ELEMENT_SELECTOR_MAXIMUM_VALUE="Time Series Element Select Maximum";
var DENE_TYPE_MNEMOSYNE_OPERATION_COPY_TIMESERIES_ELEMENT_SELECTOR_MINIMUM_VALUE="Time Series Element Select Minimum";
var DENE_TYPE_MNEMOSYNE_OPERATION_COPY_TIMESERIES_ELEMENT_SELECTOR_AVERAGE_VALUE="Time Series Element Select Average";

var  COMPLETE_TIMESERIES_ELEMENT="Complete Time Series Element";
var  TIMESERIES_TIMESTAMP="Time Series Element Timestamp";
var  TIMESERIES_VALUE="Time Series Element Value";


var DENEWORD_TYPE_ANALYTICON_DATA_SOURCE="Analyticon Data Source";
var DENEWORD_TYPE_ANALYTICON_PROFILE_POINTER="Analyticon Profile Pointer";
var DENEWORD_TYPE_ON_START_ACTION_LIST= "On Start Action List";
var DENEWORD_TYPE_OPERATION_VARIABLE= "DeneWord Operation Variable";
var DENEWORD_TYPE_OPERATION_DESTINATION= "DeneWord Operation Destination";

var DENEWORD_ACTION_EXECUTION_POINT= "Execution Point";
var DENEWORD_ACTION_EXECUTION_POINT_IMMEDIATE= "Execution Point Immediate";
var DENEWORD_ACTION_EXECUTION_POINT_POST_PULSE= "Execution Point Post Pulse";


var DENE_TYPE_DENECHAIN_VISUALIZATION_POSITION = "DeneChain Visualization Position";
var DENE_TYPE_DENE_VISUALIZATION_POSITION="Dene Visualization Position";
var DENEWORD_TYPE_DENEWORD_VISUALIZATION_POSITION="DeneWord Visualization Position";
var DENEWORD_TYPE_MICROCONTROLLER_FAULT_PATHOLOGY_MNEMOSYNE_LOCATION="Fault Pathology Mnemosyne Location";

var DENEWORD_STATUS="Status";
var DENEWORD_OPERATIONAL_MODE="OperationalMode";
var OPERATIONAL_MODE_NORMAL="Normal";
var OPERATIONAL_MODE_WPS="WPS";
var OPERATIONAL_MODE_COMMA="Comma";

var DENEWORD_TYPE_EVALUATED_VARIABLE="Evaluated Variable";
var DENEWORD_SENSOR_REQUEST_QUEUE_POSITION="Sensor Request Queue Position";
var DENEWORD_REPORTING_ADDRESS="Reporting Address";
var DENEWORD_OPERATIONAL_STATUS_RED_VALUE="Operational Status Red Value";
var DENEWORD_OPERATIONAL_STATUS_GREEN_VALUE="Operational Status Green Value";
var DENEWORD_OPERATIONAL_STATUS_BLUE_VALUE="Operational Status Blue Value";
var DENEWORD_OPERATIONAL_STATUS_BLINK_VALUE="Operational Status Blink Value";
var DENEWORD_ACTIVE="Active";
var DENEWORD_VISIBLE="Visible";
var DENEWORD_TYPE_POINTER="Dene Pointer";
var DENEWORD_MOTHER_MICROCONTROLER="Mother Microcontroller";
var DENEWORD_ACTION_PROCESSING_RESULT="Action Processing Result";
var DENEWORD_CONDITION_PROCESSING_RESULT="Condition Processing Result";
var DENEWORD_COMMAND_TO_EXECUTE = "Command To Execute";
var DENEWORD_ACTION_EXPRESSION="Action Expression";
var DENEWORD_CONDITION_EXPRESSION="Condition Expression";
var CONDITION_NAME="Condition Name";
var DENEWORD_PULSE_SIZE_KB="Pulse Size Kb";
var EVALUATION_POSITION="Evaluation Position";

//
// dene types
//
var DENE_TYPE_ACTUATOR_CONDITION = "Actuator Condition";
var DENE_TYPE_ACTUATOR_CONDITION_PROCESSING = "Actuator Condition Processing";
var DENE_PATHOLOGY ="Pathology";


//
// specific denewords
//
var DENEWORD_MICROCONTROLLER_COMMUNICATION_PROTOCOL="Microcontroller Communication Protocol";
//
// constant used in the manager to mark whether to return the complete deneword or dene or just an attribute of it
// if only an attribute is required, it is passed as text
//
var COMPLETE = "Complete";
//
// control infon the lcd
//
var LCD_DEBUG_ON_MODE = "DebugOn";
var LCD_DEBUG_OFF_MODE = "DebugOff";
var EXPIRATION_SECONDS = "Expiration Seconds";

//
// constants that represent the different attribute keys in a 
// deneword.  used in searchs to specify what to return from a deneword
// search when COMPLETE is not used
//
var DENEWORD_COLOR_ATTRIBUTE="Color";

var DENEWORD_VALUETYPE_ATTRIBUTE="Value Type";
var DENEWORD_VALUE_SET_ATTRIBUTE="Value Set";

var DENEWORD_DATA_SOURCE_ATTRIBUTE="Data Source";
var DENEWORD_DATA_LOCATION_ATTRIBUTE="Data Location";

var DENEWORD_SENSORS_ACTIVE = "Sensors Active";
var DENEWORD_ACTUATORS_ACTIVE = "Actuators Active";
var DENEWORD_ANALYTICONS_ACTIVE = "Analyticons Active";
var DENEWORD_MNEMOSYCONS_ACTIVE = "Mnemosycons Active";


var DENEWORD_DEFAULT_VALUE = "Default";
var DENEWORD_VALUE_ATTRIBUTE = "Value";
var DENEWORD_QUANTITY_ATTRIBUTE = "Quantity";

var DENEWORD_TARGET_ATTRIBUTE = "Target";
var DENEWORD_TIMESTRING_VALUE = "Time String";
var DENEWORD_TIMESTRING_FORMAT_VALUE = "Time String Format";

var DENEWORD_UNIT_ATTRIBUTE = "Units";
var DENEWORD_NAME_ATTRIBUTE = "Name";
var DENEWORD_MAXIMUM_ATTRIBUTE = "Maximum";
var DENEWORD_MINIMUM_ATTRIBUTE = "Minimum";

var DENEWORD_REQUIRED_ATTRIBUTE = "Required";
var DENEWORD_DENEWORD_TYPE_ATTRIBUTE = "DeneWord Type";
var SORTING_PARAMETER="Sorting Parameter";
var SORTING_ORDER="Sorting Order";
var PANEL_TITLE="Panel Title";


var DENE_DENE_NAME_ATTRIBUTE = "Name";
var DENE_DENE_TYPE_ATTRIBUTE = "Dene Type";
var DENE_TYPE_EXTERNAL_DATA_SOURCE = "External Data Source";
//
// the pulse_status
//
var PULSE_STATUS_FINISHED = "FinishedPulse";
var PULSE_STATUS_STARTED="Started Pulse";

//
// commands known to the commandServer
//
var COMMAND_INITIATING_PULSE="Initiating Pulse";
var COMMAND_PULSE_COMPLETED="Pulse Completed";
var COMMAND_SERVER_PORT=7777;
var COMMAND_SERVER_IP_LOCALHOST="127.0.0.1";
var COMMAND_QUEUE_EMPTY="Command Queue Empty";
//
// THE MAPPED BUS parameters
//
var MAPPED_BUS_FILE="PulseGenerator";
var MAPPED_BUS_FILE_PULSE_STATUS="PulseStatus";

var STARTING_PULSE_MAPPED_BUS_MESSAGE="Started Pulse";
var PULSE_FINISHED_MAPPED_BUS_MESSAGE="Pulse Finished";
var PULSE_SIZE_MESSAGE="Pulse Size";
var PULSE_TIMESTAMP="Pulse Timestamp";
var PULSE_TIMESTAMP_MILLISECONDS="Pulse Timestamp in Milliseconds";
var PULSE_CREATION_DURATION_MILLIS="Pulse Creation Duration Millis";


//
// The record size must be at least big enough to contain a pulse
//
var DENEWORD_TYPE_MICROCONTROLLER_PROCESSING_CLASSNAME="Microcontroller Processing Class Name";
var COMMAND_REQUEST_NOT_EXECUTED="Not Executed";
var COMMAND_REQUEST_EXECUTED="Executed";
var COMMAND_REQUEST_SKIPPED_AT_INIT="Skipped at init";
var COMMAND_EXECUTED_ON="ExecutedOn";
var COMMAND_EXECUTION_STATUS="Status";
var COMMAND_CODE="CommandCode";
var COMMAND_REQUEST_EXECUTION_OK="Command Request Succesfull";
var COMMAND_REQUEST_INVALID_PASSWORD="Invalid Password";
var COMMAND_REQUEST_PENDING_EXECUTION="Pending Execution";

//
// the index for the front end
//
var TODAY_INDEX="TodayIndex";
var LAST_24_HOURS_INDEX="Last24HoursIndex";

var CODON="Codon";
var TIMER_FINISHED = "TimerFinished";

//
// the different types of processing to be done
// by the Mnemosyne
//
var DENE_TYPE_MNEMOSYNE_PROCESSING_INFO="Mnemosyne Processing Info";

var DENEWORD_TYPE_MNEMOSYNE_ANALYSIS="Mnemosyne Analysis";
var DENE_TYPE_ANALYTYCON="Analyticon";
var DENEWORD_MNEMOSYNE_ANALYSIS_PROFILE="Mnemosyne Analysis Profile";

var DENEWORD_TYPE_MNEMOSYNE_PROCESSING_INTERVAL="Mnemosyne Processing Interval";
var DENEWORD_TYPE_MNEMOSYNE_PROCESSING_INTERVAL_START="Mnemosyne Processing Interval Start";
var DENEWORD_TYPE_MNEMOSYNE_PROCESSING_INTERVAL_END="Mnemosyne Processing Interval End";
var MNEMOSYNE_RECURRENCE_ONE_TIME="One Time";
var MNEMOSYNE_RECURRENCE_RECURRENT="Recurrent";
var DENEWORD_TYPE_MNEMOSYNE_PROCESSING_INTERVAL_TYPE="Mnemosyne Processing Interval Type";
var MNEMOSYNE_PROCESSING_INTERVAL_TODAY="Today";
var MNEMOSYNE_PROCESSING_INTERVAL_TYPE_RANGE="Range";

//
// all the functions in the mnemosyne
// no spaces allowed and use function style
// it goes in the "Value" attribute of a deneword
// ie 
// deneWord.put("Value", TeleonomeConstants.MNEMOSYNE_PROCESSING_FUNCTION_RANGE_EVALUATION);

//
var MNEMOSYNE_PROCESSING_FUNCTION_RANGE_EVALUATION="evaluateRange";
var MNEMOSYNE_PROCESSING_SAMPLE_FREQUENCY= "Mnemosyne Sample Frequency Seconds";
var MNEMOSYNE_PROCESSING_SAMPLE_TYPE="Mnemosyne Data Sample Type";

var MNEMOSYNE_PROCESSING_NOW="Now";
var DENEWORD_TYPE_MNEMOSYNE_DATA_RANGE="Mnemosyne Data Range";
var MNEMOSYNE_GRAPH_DISPLAY_ALL_VALUES="All Values";
var MNEMOSYNE_ANALYSIS_MAXIMUM_MINIMUM="Maximum and Minimum";
var MNEMOSYNE_ANALYSIS_MAXIMUM="Maximum";
var MNEMOSYNE_ANALYSIS_MINIMUM="Minimum";
var MNEMOSYNE_ANALYSIS_AVERAGE="Average";
var SORTING_ORDER_DESCENDING="Descending";
var SORTING_ORDER_ASCENDING="Ascending";

var MNEMOSYNE_DENECHAIN_CURRENT_HOUR="Mnemosyne Current Hour";
var MNEMOSYNE_DENECHAIN_CURRENT_DAY="Mnemosyne Today";
var MNEMOSYNE_DENECHAIN_YESTERDAY="Mnemosyne Yesterday";
var MNEMOSYNE_DENECHAIN_CURRENT_WEEK="Mnemosyne Current Week";
var MNEMOSYNE_DENECHAIN_CURRENT_MONTH="Mnemosyne Current Month";
var MNEMOSYNE_DENECHAIN_CURRENT_QUARTER="Mnemosyne Current Quarter";
var MNEMOSYNE_DENECHAIN_CURRENT_SEMESTER="Mnemosyne Current Semester";
var MNEMOSYNE_DENECHAIN_CURRENT_YEAR="Mnemosyne Current Year";
var MNEMOSYNE_TIMESTAMP_FORMAT="dd/MM/yyyy HH:mm:ss";
var MNEMOSYNE_TIME_FORMAT="HH:mm";
var MNEMOSYNE_DATE_FORMAT="dd/MM/yyyy";
var MNEMOSYNE_LIST_FILE_INFO_OPERATION="Mnemosyne List File Info Operation";
var MNEMOSYNE_CREATE_DENE_OPERATION="Mnemosyne Create Dene Operation";
var MNEMOSYNE_HOURLY_MUTATION="Hourly";
var MNEMOSYNE_DAILY_MUTATION="Daily";
var MNEMOSYNE_WEEKLY_MUTATION="Weekly";
var MNEMOSYNE_MONTHLY_MUTATION="Monthly";
var MNEMOSYNE_YEARLY_MUTATION="Yearly";
var DENEWORD_HOUR_IN_DAY="Hour in Day";
var DENEWORD_DAY_IN_WEEK="Day in Week";
var DENEWORD_DAY_IN_MONTH="Day in Month";
var DENEWORD_MONTH_IN_YEAR="Month in Year";
var DENEWORD_TYPE_MNEMOSYCON_FORGET_APPROACH="Mnemosycon Forget Approach";
var DENEWORD_TYPE_MNEMOSYCON_EXPRESSION_VARIABLE_DEFINITION = "Mnemosycon Expression Variable Definition";
var DENEWORD_EXECUTION_POSITION="Execution Position";
var MNEMOSYCON_PATHOLOGY_MNEMOSYNE_LOCATION="Mnemosycon Pathology Mnemosyne Location";

var DENECHAIN_MNEMOSYCON_LOGIC_PROCESSING="Mnemosycon Logic Processing";
var DENE_TYPE_MNEMOSYCON_PROCESSING="Mnemosycon Processing";
var DENEWORD_TYPE_MNEMOSYCON_RULES_LIST_POINTER="Mnemosycon Rules List Pointer";
var DENEWORD_TYPE_MNEMOSYCON_RULE_POINTER="Mnemosycon Rule Pointer";
var DENEWORD_TYPE_MNEMOSYCON_FORGET_APPROACH_DATABASE_SIZE_TO_DISK_SIZE="Percentage Database To Disk";
var DENEWORD_TYPE_MNEMOSYCON_FORGET_APPROACH_ORGANISMPULSE_SIZE_TO_DISK_SIZE="Percentage OrganismPulse To Disk";
var DENEWORD_TYPE_MNEMOSYCON_FORGET_APPROACH_PULSE_SIZE_TO_DISK_SIZE="Percentage Pulse To Disk";

var MNEMOSYCON_RULE_SOURCE="Mnemosycon Rule Source";
var MNEMOSYCON_RULE_TIME_UNIT="Mnemosycon Rule Until Time Unit";
var MNEMOSYCON_RULE_TIME_UNIT_VALUE="Mnemosycon Rule Until Time Value";
var TIME_UNIT_DAY="Day";
var TIME_UNIT_WEEK="Week";
var TIME_UNIT_MONTH="Month";
var TIME_UNIT_YEAR="Year";
var PULSE_TABLE="Pulse";
var ORGANISMPULSE_TABLE="OrganismPulse";
var MNEMOSYCON_RULE_TEAM_PARAMETER="Team Parameter";
var MNEMOSYCON_TEAM_MEMBER="Mnemosycon Team Member";
var DENE_MNEMOSYCON_TEAM_DEFINITION="Mnemosycon Team Definition";
var MNEMOSYCON_RULE_TEAM_PARAMETER_TEAM="Team";
var MNEMOSYCON_RULE_TEAM_PARAMETER_NOT_TEAM="Not Team";
var MNEMOSYCON_RULE_TEAM_PARAMETER_ALL="All";
var DENE_TYPE_MNEMOSYCON_RULE_PROCESSING="Mnemosycon Rule Processing";
var MNEMOSYCON_RULE_EXECUTION_MILLIS="Mnemosycon Rule Execution Millis";
var PATHOLOGY_MNEMOSYCON_FAILED="Mnemosycon Failed";
var DENEWORD_TYPE_MNEMOSYCON_SUCCESS_TASKS_POINTER="Mnemosycon Success Tasks Pointer";
var DENEWORD_TYPE_MNEMOSYCON_FAILURE_TASKS_POINTER="Mnemosycon Failure Tasks Pointer";

var MNEMOSYNE_ADD_DENEWORD_TO_DENE_OPERATION="Mnemosyne Add DeneWord To Dene Operation";
var MNEMOSYNE_UPDATE_VALUE_OPERATION="Mnemosyne Update Value Operation";

var MNEMOSYNE_DENEWORD_OPERATION="Operation";

var MNEMOSYNE_DENE_WORD_TYPE_TARGET="Mnemosyne Target";
var MNEMOSYNE_DENE_WORD_TYPE_COPY_DENEWORD="Copy DeneWord";
var MNEMOSYNE_DENE_WORD_TYPE_CREATE_DENEWORD_SOURCE="Create DeneWord Source";
var MNEMOSYNE_DENEWORD_FILE_LIST_PATH="File List Path";
var MNEMOSYNE_DENEWORD_NEW_DENE_NAME="New Dene Name";
var MNEMOSYNE_DENEWORD_TARGET_POSITION="Target Position";

var MNEMOSYNE_CREATE_DENEWORD_ADD_TO_DENE_OPERATION="Create DeneWord Add To Dene";
var MNEMOSYNE_DENEWORD_AGGREGATION_OPERATION="DeneWord Aggregation";
var MNEMOSYNE_DENEWORD_TRANSFORMATION_OPERATION="DeneWord Transformation";

var MNEMOSYNE_DENEWORD_TYPE_TRANSFORMATION_DATA_SOURCE="Transformation Data Source";
var MNEMOSYNE_DENEWORD_TRANSFORMATION_OPERATION_FUNCTION="DeneWord Transformation Function";
var MNEMOSYNE_DENEWORD_TRANSFORMATION_OPERATION_FUNCTION_ELAPSED_TIME="Transformation Function Seconds To Elapsed Time";

var MNEMOSYNE_DENEWORD_AGGREGATION_OPERATION_AGGREGATE_TO="Aggregate To";
var MNEMOSYNE_DENEWORD_AGGREGATION_OPERATION_AGGREGATE_Value="Aggregate Value";


var DENEWORD_TYPE_MNEMOSYNE_PROCESSING_FUNCTION="Mnemosyne Function";
var DENEWORD_TYPE_MNEMOSYNE_SAMPLE_FREQUENCY="Mnemosyne Sample Frequency Seconds";
var DENEWORD_TYPE_MNEMOSYCON_REMEMBERED_DENEWORD="Remembered DeneWord";
var DENEWORD_TYPE_MNEMOSYCON_REMEMBERED_DENE="Remembered Dene";
var DENEWORD_TYPE_MNEMOSYCON_REMEMBERED_DENECHAIN="Remembered DeneChain";
var DENE_TYPE_MNEMOSYCON_DENEWORDS_TO_REMEMBER="DeneWords To Remember";



var VISUALIZATION_OBJECT_TABLE="Table";
var VISUALIZATION_OBJECT_LINE_GRAPH="Line Graph";
var DENE_TYPE_VISUALIZATION_STYLE="Visualization Definition";
var DENEWORD_TYPE_VISUALIZATION_OBJECT="Visualization Object";
var DENEWORD_TYPE_VISUALIZATION_PARAMETER="Visualization Parameter";

//
//

var PATHOLOGY_CAUSE = "Cause";
var PATHOLOGY_LOCATION = "Location";
var PATHOLOGY_DENEWORD_TYPE= "Pathology Dene Word Type";
var PATHOLOGY_LOCATION_MICROCONTROLLER= "Microcontroller";
var PATHOLOGY_LOCATION_NETWORK= "Network";
var PATHOLOGY_LOCATION_MEDULA= "Medula";
var PATHOLOGY_PULSE_LATE= "Pulse Late";
var PATHOLOGY_HEART_CRASHED_HPROF= "Heart Crashed hprof";

var PATHOLOGY_MEDULA_FORCED_REBOOT="Medula Forced Reboot";
var PATHOLOGY_HYPOTHALAMUS_DIED= "Hypothalamus died";
var  PATHOLOGY_HEART_DIED= "Heart died";
var  PATHOLOGY_HEART_PULSE_LATE= "Heart Pulse Late";
var  PATHOLOGY_CORRUPT_PULSE_FILE= "Corrupt Pulse File";
var PATHOLOGY_TOMCAT_PING_LATE= "Tomcat Ping Late";
var PATHOLOGY_DETAILS_LABEL= "Details";
var MEDULA_PATHOLOGY_MNEMOSYNE_LOCATION="Medula Pathology Mnemosyne Location";



var PATHOLOGY_EVENT_TIMESTAMP = "Pathology Event Timestamp";
var PATHOLOGY_EVENT_MILLISECONDS =  "Pathology Event Milliseconds";
var PATHOLOGY_AVAILABLE_MEMORY_BELOW_THRESHOLD = "Available Memory Below Threshold";
var PATHOLOGY_DISK_SPACE_BELOW_THRESHOLD = "Disk Space Below Threshold";
var PATHOLOGY_PULSE_DURATION_ABOVE_THRESHOLD = "Pulse Generation Above Threshold";
var PATHOLOGY_ANALYTICON_SOURCES_LATE = "Analyticon Sources Late";


//
// Pathology fault deneword type
//
var PATHOLOGY_DATA_NOT_AVAILABLE = "Data Not Available";
var PATHOLOGY_DATA_OUT_OF_RANGE = "Data Out Of Range";
var PATHOLOGY_DATA_STALE="Data Stale";
var PATHOLOGY_INITIAL_STATE_NETWORK_UNAVAILABLE="Initial State Network Unavailable";
var PATHOLOGY_NETWORK_STATE_MISTMATCH="Network State Mismatch";

var PATHOLOGY_NETWORK_UNAVAILABLE="Network Unavailable";
var PATHOLOGY_DENE_EXTERNAL_DATA= "External Data Pathology";
var PATHOLOGY_DENE_SENSOR_OUT_OF_RANGE= "Sensor Out Of Range Pathology";
var PATHOLOGY_DENE_MICROCONTROLLER_FAULT= "Microcontroller Fault";
var PATHOLOGY_DENE_MICROCONTROLLER_COMMUNICATION= "Microcontroller Communication Pathology";
var PATHOLOGY_DENEWORD_OPERATING_SYSTEM_NETWORK_IDENTITY = "Operating System Network Identity";
var PATHOLOGY_DENEWORD_DENOME_NETWORK_IDENTITY = "Denome Network Identity";


var EXTERNAL_SOURCE_TELEONOME_NAME="External Source Teleonome Name";
var EXTERNAL_DATA_STATUS_STALE="danger";
var EXTERNAL_DATA_STATUS="ExternalDataStatus";
var EXTERNAL_DATA_STATUS_OK="success";
var DENE_SYSTEM_DATA="System Data";
var DENE_WIFI_INFO="Wifi Info";


//
// the values to use for the status message in case the application calling 
// the DenomeManager does not set one
//
var STATUS_MESSAGE_USE_CURRENT_PULSE_MILLIS="Status Message Use Current Pulse Millis";
var STATUS_MESSAGE_USE_CURRENT_PULSE_SECONDS="Status Message Use Current Pulse Seconds";
var STATUS_MESSAGE_USE_CURRENT_PULSE_MINUTES="Status Message Use Current Pulse Minutes";
var STATUS_MESSAGE_USE_CURRENT_AND_AVAILABLE_PULSE_SECONDS="Status Message Use Current and Available Pulse Seconds";
var STATUS_MESSAGE_USE_CURRENT_AVAILABLE_PULSE_NUMBER_ANALYTICONS="Status Message Use Current Available Pulse Number of Analyticons";
var STATUS_MESSAGE_EXTERNAL_DATA_STALE="External Data Stale";

//
// The Egg Denes that need to be removed during the fertilization
var EGG_VIRTUAL_MICROCONTROLLER="Simple Micro Controller";
var EGG_VIRTUAL_ACTUATOR="VirtualActuator";

//
// Sperm structure
//
var SPERM="Sperm";
var SPERM_PURPOSE="Purpose";
var SPERM_PURPOSE_TYPE="Purpose Type";
var SPERM_PURPOSE_TYPE_MUTATE="Mutate";
var SPERM_HYPOTHALAMUS="Hypothalamus";
var SPERM_HYPOTHALAMUS_HOMEOBOXES="Homeoboxes";
var SPERM_HYPOTHALAMUS_ACTIONS="Actions";
var SPERM_HYPOTHALAMUS_MUTATIONS="Mutations";

var SPERM_DENE_TYPE_CREATE_DENE_CHAIN="Create Dene ChainActions";
var SPERM_ACTION_DENEWORD_EXECUTION_POSITION="Execution Position";
var SPERM_ACTION_DENWORD_UPDATE_VALUE_LIST="DeneWords Update List";
var SPERM_ACTION_DENEWORD_EXECUTION_POINT="Execution Point";
var SPERM_ACTION_DENEWORD_EXECUTION_POINT_PRE_HOMEBOX="Pre Homebox Insertion";
var SPERM_ACTION_DENEWORD_EXECUTION_POINT_POST_HOMEBOX="Post Homebox Insertion";
var SPERM_ACTION_DENEWORD_DENECHAIN_NAME="DeneChain Name";
var SPERM_DENE_TYPE_UPDATE_DENEWORD_VALUE="Update DeneWord";


var SPERM_MEDULA="Medula";
var SPERM_PURPOSE_NAME="Name";
var SPERM_PURPOSE_DESCRIPTION="Description";
var SPERM_HOMEOBOX_INDEX="Homeobox Index";
var SPERM_DENE_TYPE_DENEWORD_CARRIER="DeneWord Carrier";
var SPERM_DENE_TYPE_DENEWORD_REMOVER="DeneWord Remover";
var SPERM_DENE_TYPE_HOMEOBOX_METADATA="HomeoBox Metadata";
var SPERM_DATE_FORMAT="ddMMyyyy_HHmm";


var SPERM_HOMEOBOX_DENES="Denes";
var SPERM_ACTIONS_DENES="Denes";

var DENEWORD_TYPE_HOX_DENE_POINTER="Hox Dene Pointer";
var DENEWORD_TYPE_SPERM_DENOME_OPERATION_POINTER="Sperm Operation Pointer";




var SPERM_ACTION_DENE_TARGET="Target";

var SPERM_HOX_DENE_TARGET="Target";
var SPERM_HOX_DENE_POINTER="Hox Dene Pointer";
var SPERM_VALIDATED="Sperm Validated";

//
// Variables for Sertoli
//
var HOMEOBOX_DEFINITION_TYPE="Homeobox Definition Type";
var HOMEOBOX_DEFINITION_SENSOR="Sensor";
var HUMAN_INTERFACE_PANEL = "Human Interface Panel";
var IN_PANEL_POSITION=  "In Panel Position";

//
// the denetypes to make the human interface
//
var DENE_TYPE_HUMAN_INTERFACE_PAGE="Human Interface Page";
var DENE_TYPE_HUMAN_INTERFACE_COMPONENT="Human Interface Component";
var DENEWORD_TYPE_HUMAN_INTERFACE_COMPONENT_PROPERTY="Human Interface Component Property";
var DENEWORD_TYPE_HUMAN_INTERFACE_COMPONENT_TEMPLATE="Human Interface Component Template";
var DENEWORD_TYPE_HUMAN_INTERFACE_COMPONENT_TEMPLATE_URL="Human Interface Component Template URL";
var DENEWORD_TYPE_HUMAN_INTERFACE_COMPONENT_STYLES="Human Interface Component Styles";
var DENEWORD_TYPE_HUMAN_INTERFACE_COMPONENT_STYLES_URL="Human Interface Component Styles URL";

//
// everything related to the mnemotycons
//
var DENECHAIN_MNEMOSYCONS="Mnemosycons";
var DENE_TYPE_MNEMOSYCON="Mnemosycon";
var DENE_TYPE_MNEMOSYCON_DATA_SOURCE="Mnemosycon Data Source";
var MNEMOSYCON_DATA_SOURCE_PULSE="Pulse Data Source";
var MNEMOSYCON_DATA_SOURCE_ORGANISM="Organism Data Source";
var DENEWORD_TYPE_MNEMOSYCON_PROFILE_POINTER="Mnemosycon Profile Pointer";
var MNEMOSYCON_MILLIS_STARTING_POINT="MillisStartingPoint";
var MNEMOSYCON_NEXT_BATCH_MILLIS_STARTING_POINT="NextBatchMillisStartingPoint";
var MNEMOSYCON_NUMBER_OF_PULSES_TO_RETRIEVE_PER_BATCH="Number Pulses Per Batch";
var MNEMOSYCON_ORGANISM_TELEONOME_TO_PUBLISH="Organism Teleonome To Publish";
var MNEMOSYCON_ORGANISM_TELEONOME_TO_PUBLISH_ALL_TELEONOME="All Teleonomes";
var MNEMOSYCON_FUNCTION="Mnemosycon Function";
var PATHOLOGY_SQL_EXCEPTION="SQL Exception";
var PATHOLOGY_JSON_EXCEPTION="JSON Exception";
var PATHOLOGY_DENE_MNEMSYCON_PROCESSING_ERROR="Mnemosycon Processing Error";
var PATHOLOGY_EXCEPTION_STACK_TRACE="Exception Stacktrace";
var DENECHAIN_MNEMOSYCON_PROCESSING="Mnemosycon Processing";

var DENE_TYPE_MNEMOSYCON_ACTION_PROCESSING="Mnemosycon Action Processing";
var DENE_NAME_MNEMOSYCON_LEARN_MY_HISTORY="Learn My History";
var DENE_NAME_MNEMOSYCON_LEARN_OTHER_HISTORY="Learn Others History";
var DENE_NAME_MNEMOSYCON_LEARN_OTHER_HISTORY_TELEONOME="Learn Others History Teleonome";
var MNEMOSYCON_NUMBER_OF_SECONDS_TO_COMPLETE_CYCLE="Seconds To Complete Cycle";
var MNEMOSYCON_CYCLE_START_MILLISECONDS="Cycle Start Milliseconds";
var MNEMOSYCON_CYCLE_START_TIMESTAMP="Cycle Start Timestamp";
var MNEMOSYCON_MAXIMUM_NUMBER_OF_RECORDS_PER_BATCH="Maximum Number Records Per Batch";
var MNEMOSYCON_MINIMUM_NUMBER_OF_RECORDS_PER_BATCH="Minimum Number Records Per Batch";
var MNEMOSYCON_NUMBER_OF_PULSES_TO_RETRIEVE_PER_BATCH_NEEDED_FOR_TIME_RESTRICTION="Records Needed For Time Restriction";
var MNEMOSYCON_MAXIMUM_PERCENTAGE="Maximum Percentage";


//
// everything related to human interface 
//
var DENECHAIN_TYPE_HUMAN_INTERFACE_CONTROL_PARAMETERS="Human Interface Control Parameters";
var HUMAN_INTERFACE_CONTROL_PARAMETERS ="Human Interface Control Parameters";
var DENEWORD_TYPE_WEB_PAGE_VIEW_DEFINITION_POINTER="Web Page View Definition Pointer";
var DENEWORD_TYPE_PANEL_DENECHAIN_POINTER="Panel DeneChain Pointer";
var DENEWORD_TYPE_PANEL_IN_PAGE_POSITION="Panel In Page Position";
var DENEWORD_TYPE_PANEL_IN_PANEL_POSITION="Panel In Panel Position";
var DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER="Panel Data Source Pointer";
var DENEWORD_TYPE_PANEL_VISUALIZATION_STYLE="Panel Visualization Style";
var DENEWORD_OPERATIONAL_STATUS_BOOTSTRAP_EQUIVALENT="Operational Status Bootstrap Equivalent";
var DENEWORD_TYPE_COLUMN_DATA_SOURCE_POINTER="Column Data Source Pointer";
var DENEWORD_DISPLAY_TABLE_COLUMN_DEFINITION_POINTER="Display Table Column Definition Pointer";
var DENEWORD_TYPE_COLUMN_IN_TABLE_POSITION="Column In Table Position";
var DENEWORD_TYPE_COLUMN_HEADER="Column Header";


var BOOTSTRAP_DANGER="danger";
var BOOTSTRAP_WARNING="warning";
var BOOTSTRAP_SUCCESS="success";

//
// time related variables
//
var DENEWORD_TYPE_TIME_BASED_MUTATION_EXECUTION_TIME="Execution Time";

var TIME_MIDNIGHT="Midnight";
var TIME_Start_WEEK="StartWeek";

var TIME_DAY_BEGINNING_DAYLIGHT="Day Beginning Daylight";
var TIME_DAY_BEGINNING_CHARGING="Day Beginning Charging Main Battery";
var TIME_DAY_END_DAYLIGHT="Day End Daylight Label";
var TIME_DAY_END_CHARGING="Day End Charging Main Battery";

var TIME_DAY_BEGINNING_DAYLIGHT_MILLISECONDS="Day Beginning Daylight Milliseconds";
var TIME_DAY_BEGINNING_CHARGING_MILLISECONS="Day Beginning Charging Main Battery Milliseconds";
var TIME_DAY_END_DAYLIGHT_MILLISECONS="Day End Daylight Milliseconds";
var TIME_DAY_END_CHARGING_MILLISECONS="Day End Charging Main Battery Milliseconds";


//
//the topics for the heart
//
var HEART_QUALITY_OF_SERVICE=1;
var HEART_TOPIC_STATUS="Status";
var HEART_TOPIC_PULSE_STATUS_INFO="PulseStatusInfo";
var HEART_TOPIC_PULSE_STATUS_INFO_SECUNDARY="PulseStatusInfoSecundary";
var HEART_TOPIC_UPDATE_FORM_STATUS="UpdateFormStatus";
var HEART_TOPIC_UPDATE_FORM_REQUEST="UpdateFormRequest";
var HEART_TOPIC_UPDATE_FORM_RESPONSE="UpdateFormResponse";
var HEART_TOPIC_ASYNC_CYCLE_UPDATE="AsyncCycleUpdate";

var HEART_TOPIC_BLINK="Blink";
var HEART_TOPIC_ADA_STATUS="AdaStatus";
var HEART_TOPIC_ORGANISM_STATUS="OrganismStatus";
var HEART_TOPIC_ORGANISM_UPDATE="OrganismUpdate";
var HEART_TOPIC_AVAILABLE_SSIDS="Available SSID";
var HEART_TOPIC_EXECUTE_MANUAL_ACTION="Manual Action";
var HEART_TOPIC_RESIGNAL="Resignal";

var PROCESS_HYPOTHALAMUS="Hypothalamus";
var PROCESS_HEART="Heart";
var PROCESS_WEB_SERVER="Web Server";




//
// the different styles to present data
//
var DENEWORD_TYPE_DISPLAY_TABLE_DENEWORD_POINTER="Display Table DeneWord Pointer";
var PANEL_VISUALIZATION_STYLE_DENEWORD_TABLE="DeneWord Table";

var PANEL_VISUALIZATION_STYLE_SHORT_TERM_WEATHER_FORECAST="Short Term Weather Forecast Panel";
var PANEL_VISUALIZATION_STYLE_DAILY_WEATHER_FORECAST="Daily Weather Forecast Panel";
var PANEL_VISUALIZATION_STYLE_MANUAL_ACTION_WITH_TIMER="Manual Action With Timer Panel";


var PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL="Single Value Panel";
var PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL_COMPLETE_WIDTH="Single Value Panel Complete Width";
var PANEL_VISUALIZATION_ORGANISM_VIEW="Organism View Panel";
var PANEL_VISUALIZATION_COMPLETE_DENE_STYLE_SINGLE_VALUE_PANEL="Complete Dene Single Value Panel";
var PANEL_VISUALIZATION_SEARCH_PANEL="Search Panel";
var PANEL_VISUALIZATION_COMPLETE_DENE_STYLE_SINGLE_VALUE_PANEL_EXTERNAL_DATA="Complete Dene Single Value Panel External Data";

var PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL_EXTERNAL_DATA="Single Value Panel External Data";
var PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL_COMPLETE_WIDTH_EXTERNAL_DATA="Single Value Panel Complete Width External Data";
var PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL_EXTERNAL_TIMESTAMP="Single Value Panel External Timestamp";


var PANEL_VISUALIZATION_COMPLETE_DENE_CHAIN_STYLE_SINGLE_VALUE_PANEL="Complete Dene Chain Single Value Panel";
var PANEL_VISUALIZATION_STYLE_ACTION_EVALUATION_REPORT="Action Evaluation Report";
var PANEL_VISUALIZATION_WELL_SINGLE_VALUE_PANEL="Well Single Value";

var PANEL_VISUALIZATION_STYLE_NETWORK_MODE_SELECTOR="Network Mode Selector";
var PANEL_VISUALIZATION_STYLE_PATHOLOGY="Pathology Panel";

var PANEL_VISUALIZATION_STYLE_LINE_CHART="Line Chart Panel";
var PANEL_VISUALIZATION_STYLE_CSV_MULTI_LINE_CHART="CSV File MultiLine Chart Panel";
var PANEL_VISUALIZATION_STYLE_PIE_CHART="Pie Chart Panel";
var PANEL_VISUALIZATION_STYLE_BAR_CHART="Bar Chart Panel";

var PANEL_VISUALIZATION_STYLE_IMAGE="Image Panel";
var PANEL_VISUALIZATION_STYLE_MNEMOSYNE_TABLE="Mnemosyne Table Panel";
var PANEL_VISUALIZATION_STYLE_UPDATE_MULTIPLE_DENEWORDS_FORM="Update Multiple Denewords Form Panel";

var PANEL_VISUALIZATION_STYLE_SETTINGS_INFO="Settings Info";


var DENEWORD_TYPE_PANEL_DATA_DISPLAY_NAME="Panel Display Name";
var DENEWORD_RECORD_TIMESTAMP="Record Timestamp";


var DENECHAIN_TYPE_HUMAN_INTERFACE_WEB_PAGE ="Human Interface Web Page";
var DENEWORD_TYPE_HUMAN_INTERFACE_WEB_PAGE_INCLUDE_IN_NAVIGATION ="Include in Navigation";
var DENEWORD_HUMAN_INTERFACE_WEB_PAGE_PAGE_POSITION ="Page Position";
var DENEWORD_HUMAN_INTERFACE_PANEL_IN_PAGE_POSITION ="Panel In Page Position";
var DENEWORD_TYPE_HUMAN_INTERFACE_WEB_PAGE_PAGE_TITLE ="Page Title";
var DENEWORD_TYPE_HUMAN_INTERFACE_WEB_PAGE_GLYPH_ICON="Lower Nav Glyphicon";
var DENEWORD_TYPE_COLUMN_TD_CLASS_INFO="TDClassInfo";
var DENEWORD_TYPE_EXTERNAL_DATA_SOURCE_DENE="External Data Source Dene";
var DENEWORD_TYPE_EXTERNAL_TIMESTAMP_DATA_SOURCE_DENE="External Timestamp Data Source Dene";


