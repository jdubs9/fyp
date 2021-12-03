import React from 'react';
import { Row, Col, Card, Form, Button } from 'react-bootstrap';
import Aux from "../../../hoc/_Aux";
import axios from 'axios';
import configs from '../../../config';
import { NotificationContainer, NotificationManager } from 'react-notifications';
import Loader from '../../../App/layout/Loader';
import { connect } from 'react-redux';
import Dropzone from 'react-dropzone';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import DateTime from 'react-datetime';
import moment from 'moment';

class AddAssignments extends React.Component {

    constructor(props) {
        super(props);
        this.onDropPhoto = (files) => {
            this.setState({ files: files, isValid: { value: true, text: '' } });
        };
        this.onDropCorrectCode = (files) => {
            this.setState({ code_file: files, isValid: { value: true, text: '' } });
        };
        this.state = {
            isLoading: false,
			deletedRowId: null,
			showModal: false,
			handleCloseModal: false,
            name: "",
            description: "",
            class_id: "",
            total_marks: 0,
            isValid: {
                value: false,
                text: ''   
            },
            data: [],
            files: [],
            filesProgress: 0,
            submission_date: '',
            enable_testing: false,
            inputList: [{ inputval: "", visibility: "visible" }],
            code_file: []
        }
    }

    handleTextChange(event) {
        this.setState({ [event.name]: event.value });
    }

    componentDidMount = async () => {
       if (this.props && this.props.user && this.props.user.id && this.props.match && this.props.match.params && this.props.match.params.id) {
            await this.setState({ class_id: this.props.match.params.id })
        }
    }
    

    createNotification = (type, value) => {
        switch (type) {
            case 'info':
                NotificationManager.info(value,'', 5000);
                break;
            case 'success':
                NotificationManager.success(value, '', 5000);
                break;
            case 'warning':
                NotificationManager.warning(value, '', 5000);
                break;
            case 'error':
                NotificationManager.error(value, '', 5000);
                break;
            default: break;
        }
    };

    handleChange(e,name) {
        this.setState({ [name]: e._d.toISOString() });
    }

    handleCheckboxChange(e) {
        this.setState({ enable_testing: e.checked });
    }

    // handle input change
    handleInputListChange(e, index) {
        const { name, value } = e.target;
        var statevar = name;
        if (statevar.includes("visibility")) {
            statevar = "visibility";
        }
        const list = [...this.state.inputList];
        list[index][statevar] = value;
        this.setState({ inputList: list });
    };
    
    // handle click event of the Remove button
    handleRemoveInputListClick(index) {
        const list = [...this.state.inputList];
        list.splice(index, 1);
        this.setState({ inputList: list });
    };
    
    // handle click event of the Add button
    handleAddInputListClick() {
        const list = [...this.state.inputList];
        list.push({ inputval: "", visibility: "visible" });
        this.setState({ inputList: list });
    };
    
    async handleSubmit(e) {
        e.preventDefault();
        const { name, files, description, class_id, total_marks, submission_date, enable_testing, inputList, code_file  } = this.state;

        if (!name && name.trim().length <= 0) {
            this.setState({ isValid: { value: true, text: 'Please enter valid Assigment Title', name: 'name' }});
            return;
        }

        if (total_marks <= 0) {
            this.setState({ isValid: { value: true, text: 'Please enter valid Assigment Total Marks', name: 'total_marks' }});
            return;
        }

        if (!submission_date && submission_date.trim().length <= 0) {
            this.setState({ isValid: { value: true, text: 'Please enter valid Assigment Submission Date', name: 'submission_date' }});
            return;
        }

        if (!description && description.trim().length <= 0) {
            this.setState({ isValid: { value: true, text: 'Please enter valid Assignment Description', name: 'description' }});
            return;
        }

        if (!files.length) {
            this.setState({ isValid: { value: true, text: 'Please drop Assignment file above', name: 'files' }});
            return;
        }

        if (enable_testing && inputList[0].inputval.trim().length <= 0) {
            this.setState({ isValid: { value: true, text: 'Please enter valid test input', name: 'name' }});
            return;
        }

        if (enable_testing && !code_file.length) {
            this.setState({ isValid: { value: true, text: 'Please drop Correct Code file above', name: 'code_file' }});
            return;
        }
        
        await this.setState({ filesProgress: 0 });
        let that = this;
        const config = {
            onUploadProgress: function(progressEvent) {
                let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                that.setState({ filesProgress: percentCompleted });
            }
        }

        const inputListJson = JSON.stringify(inputList);
        console.log(inputListJson);
        
        let data = new FormData()
        data.append('assignment', files[0]);
        data.append('title', name.trim());
        data.append('description', description.trim());
        data.append('class_id', class_id);
        data.append('total_marks', total_marks);
        data.append('submission_date', submission_date);
        data.append('enable_testing', enable_testing);
        data.append('inputList', inputListJson);
        data.append('correct_code', code_file[0]);
        
        axios.post(`${configs.prod}/api/class/assignment/create`, data, config)
            .then(response => {
                this.props.history.push(`/faculty/class/list`);
            })
            .catch(err => {
                console.log('Error: ', err.response);
                if (err.response && err.response.status && (err.response.status === 400 || err.response.status === 500)) {
                    if (err.response.status === 500 && err.response.data.error.name === 'SequelizeUniqueConstraintError') {
                        this.setState({ filesProgress: 0, isValid: { value: true, text: 'Assignment with this title already exist', name:'server_error' } });
                    } else {
                        this.setState({ filesProgress: 0, isValid: { value: true, text: err.response.data.msg, name:'server_error' } });
                    }
                } else {
                    this.setState({ filesProgress: 0, isValid: { value: true, text: 'Unknown Error', name:'server_error' } });
                    //this.createNotification('error', 'Unknown Error');
                }
            });
    }
    
    goBack(e) {
        e.preventDefault();
        this.props.history.push(`/faculty/class/list`);
    }

    render() {
        const assignmentfilePreview = this.state.files.map(file => (
            <i style={{ fontSize: '20em' }} class="feather icon-file"></i>
        ));
        const codefilePreview = this.state.code_file.map(file => (
            <i style={{ fontSize: '20em' }} class="feather icon-file"></i>
        ));
        const maxSize = 104857600 * 10;
        const yesterday = moment().subtract(1, 'day');
        const disablePastDt = current => {
          return current.isAfter(yesterday);
        };
        return (
            <Aux>
                {this.state.isLoading && <Loader />}
                <Row>
                    <Col>
                        <Button onClick={(e) => this.goBack(e) } variant='outline-dark'>Back</Button>
                    </Col>
                </Row>
				<Row>
                    <NotificationContainer/>
                    <Col>
                        <Card>
                            <Card.Header>
                                <Card.Title as="h5">Add Assignment</Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Form className="col-md-12" onSubmit={(e) => this.handleSubmit(e)}>
                                        <fieldset disabled={this.state.isLoading} className={this.state.isLoading ? 'opacity-5' : ''}>
                                            <Form.Row>
                                                <Col md={{ span: 8, offset: 2 }}>
                                                    <Form.Group className="mb-2" controlId="formBasicEmail">
                                                        <Form.Label>Assignment Name</Form.Label>
                                                        <Form.Control 
                                                            type="text" 
                                                            name="name" 
                                                            placeholder="Assignment Name" 
                                                            value={this.state.name}
                                                            className={this.state.isValid.value && this.state.isValid.name === 'name' ? 'in-valid-input' : ''}
                                                            onFocus={() => this.setState({ isValid: { value: false, text: ''}})}
                                                            onChange={(e) => this.handleTextChange(e.target) }
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Form.Row>
                                            <Form.Row>
                                                <Col md={{ span: 8, offset: 2 }}>
                                                    <Form.Group className="mb-2" controlId="formBasicEmail">
                                                        <Form.Label>Assignment Total Marks</Form.Label>
                                                        <Form.Control 
                                                            type="number" 
                                                            name="total_marks" 
                                                            min={0}
                                                            placeholder="Assignment Total Marks" 
                                                            value={this.state.total_marks}
                                                            className={this.state.isValid.value && this.state.isValid.name === 'total_marks' ? 'in-valid-input' : ''}
                                                            onFocus={() => this.setState({ isValid: { value: false, text: ''}})}
                                                            onChange={(e) => this.handleTextChange(e.target) }
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Form.Row>
                                            <Form.Row>
                                                <Col md={{ span: 8, offset: 2 }}>
                                                    <Form.Group className="mb-2" controlId="exampleForm.ControlInput1">
                                                        <Form.Label>Submission Date</Form.Label>
                                                        <DateTime 
                                                            isValidDate={disablePastDt}
                                                            inputProps={{ readOnly: true }}
                                                            className={this.state.isValid.value && this.state.isValid.name === 'submission_date' ? 'in-valid-input' : ''}
                                                            onFocus={() => this.setState({ isValid: { value: false, text: '', name:''}})}
                                                            onChange={ (e) => this.handleChange(e,'submission_date')} 
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Form.Row>
                                            <Form.Row>
                                                <Col md={{ span: 8, offset: 2 }}>
                                                    <Form.Group controlId="exampleForm.ControlTextarea1">
                                                        <Form.Label>Assignment Description</Form.Label>
                                                        <Form.Control 
                                                            as="textarea" 
                                                            name='description'
                                                            rows={3}
                                                            value={this.state.description}
                                                            className={this.state.isValid.value && this.state.isValid.name === 'description' ? 'in-valid-input' : ''}
                                                            onFocus={() => this.setState({ isValid: { value: false, text: ''}})}
                                                            onChange={(e) => this.handleTextChange(e.target) }
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Form.Row>
                                            <Form.Row>
                                                <Col md={{ span: 8, offset: 2 }}>
                                                    <Dropzone 
                                                        onDrop={this.onDropPhoto} 
                                                        // accept="video/*" 
                                                        minSize={0}
                                                        maxSize={maxSize}
                                                        multiple={false}
                                                        name="assignment_file"
                                                        id="assignment_file"
                                                    >
                                                        {({getRootProps, getInputProps, isDragActive, isDragReject, rejectedFiles}) => {
                                                            const isFileTooLarge = rejectedFiles && rejectedFiles.length > 0 && rejectedFiles[0].size > maxSize;
                                                            return (
                                                                <section>
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent:'center', borderWidth: 2, height: '25em', borderRadius: 2, textAlign: 'center', borderColor: '#eeeeee', borderStyle: 'dashed', backgroundColor: '#fafafa', color: '#bdbdbd' }} 
                                                                    {...getRootProps({className: 'dropzone', name:"assignment_file", id:"assignment_file",
                                                                        onClick: event => event.stopPropagation()
                                                                    })}>
                                                                        <input {...getInputProps()} />
                                                                        {!isDragActive && !assignmentfilePreview.length && 'Drop a assignment file to upload!'}
                                                                        {isDragActive && !isDragReject && "Drop it like it's hot!"}
                                                                        {isDragReject && "File type not accepted, sorry!"}
                                                                        {isFileTooLarge && (
                                                                            <div className="text-danger mt-2">
                                                                              File is too large. Max Size 1GB
                                                                            </div>
                                                                        )}
                                                                        { assignmentfilePreview }
                                                                        { assignmentfilePreview.length ? <div style={{ width: '15%', position: 'absolute', padding: 14, backgroundColor: 'whitesmoke', borderRadius: 20 }}>
                                                                            <CircularProgressbar value={this.state.filesProgress} text={`${this.state.filesProgress}%`} /> 
                                                                            </div> : null 
                                                                        }
                                                                    </div>
                                                                    {
                                                                        this.state.isValid.value && this.state.isValid.name === 'files' ?
                                                                        <Form.Text style={{ color: 'red' }}>
                                                                            { this.state.isValid.text }
                                                                        </Form.Text> : ''
                                                                    }
                                                                </section>
                                                            )}
                                                        }
                                                    </Dropzone>
                                                </Col>
                                            </Form.Row>
                                            <Form.Row>
                                                <Col md={{ span: 8, offset: 2 }}>
                                                    <Form.Group controlId="formBasicCheckbox">
                                                        <Form.Check 
                                                            type="checkbox"
                                                            name='enable_testing'
                                                            id='enable_testing'
                                                            label="Enable Automated Code Testing"
                                                            onChange={(e) => this.handleCheckboxChange(e.target) }
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Form.Row>
                                            {this.state.enable_testing && this.state.inputList.map((x, i) => {
                                                return (
                                                    <Form.Row className="align-items-center">
                                                        <Col md={{ span: 3, offset: 2 }}>
                                                            <Form.Group className="mb-2" controlId="formBasicEmail">
                                                                <Form.Label>Input</Form.Label>
                                                                <Form.Control 
                                                                    type="text" 
                                                                    name="inputval" 
                                                                    placeholder="Enter input test value" 
                                                                    value={x.inputval}
                                                                    // className={this.state.isValid.value && this.state.isValid.name === 'name' ? 'in-valid-input' : ''}
                                                                    // onFocus={() => this.setState({ isValid: { value: false, text: ''}})}
                                                                    onChange={e => this.handleInputListChange(e, i)}
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={{ span: "auto" }}>
                                                            <Form.Group>
                                                                <Form.Check 
                                                                    type="radio"
                                                                    name={'visibility-'+i}
                                                                    id='visible'
                                                                    value='visible'
                                                                    label="Visible"
                                                                    defaultChecked
                                                                    onChange={e => this.handleInputListChange(e, i)}
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={{ span: "auto" }}>
                                                            <Form.Group>
                                                                <Form.Check 
                                                                    type="radio"
                                                                    name={'visibility-'+i}
                                                                    id='hidden'
                                                                    value='hidden'
                                                                    label="Hidden"
                                                                    onChange={e => this.handleInputListChange(e, i)}
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={{ span: "auto" }}>
                                                        {this.state.inputList.length !== 1 &&
                                                                <Button type="button" style={{ marginTop: '1.8rem', width: '100%' }} variant={"primary"}
                                                                    onClick={() => this.handleRemoveInputListClick(i)}>
                                                                    { 'Remove' }
                                                                </Button>
                                                        }
                                                        </Col>
                                                        <Col md={{ span: "auto" }}>
                                                        {this.state.inputList.length - 1 === i &&
                                                                <Button type="button" style={{ marginTop: '1.8rem', width: '100%' }} variant={"primary"}
                                                                    onClick={() => this.handleAddInputListClick()}>
                                                                    { 'Add More Inputs' }
                                                                </Button>
                                                        }
                                                        </Col>
                                                    </Form.Row>
                                                );
                                            })}
                                            {this.state.enable_testing &&
                                            <Form.Row>
                                                <Col md={{ span: 8, offset: 2 }}>
                                                    <Dropzone 
                                                        onDrop={this.onDropCorrectCode} 
                                                        accept=".py,text/x-python,application/x-python-code,python" 
                                                        minSize={0}
                                                        maxSize={maxSize}
                                                        multiple={false}
                                                        name="code_file"
                                                        id="code_file"
                                                    >
                                                        {({getRootProps, getInputProps, isDragActive, isDragReject, rejectedFiles}) => {
                                                            const isFileTooLarge = rejectedFiles && rejectedFiles.length > 0 && rejectedFiles[0].size > maxSize;
                                                            return (
                                                                <section>
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent:'center', borderWidth: 2, height: '25em', borderRadius: 2, textAlign: 'center', borderColor: '#eeeeee', borderStyle: 'dashed', backgroundColor: '#fafafa', color: '#bdbdbd' }} 
                                                                    {...getRootProps({className: 'dropzone', name:"code_file", id:"code_file",
                                                                        onClick: event => event.stopPropagation()
                                                                    })}>
                                                                        <input {...getInputProps()} />
                                                                        {!isDragActive && !codefilePreview.length && 'Drop a correctly functioning code file to upload!'}
                                                                        {isDragActive && !isDragReject && "Drop it like it's hot!"}
                                                                        {isDragReject && "Only Python files will be accepted!"}
                                                                        {isFileTooLarge && (
                                                                            <div className="text-danger mt-2">
                                                                              File is too large. Max Size 1GB
                                                                            </div>
                                                                        )}
                                                                        { codefilePreview }
                                                                        { codefilePreview.length ? <div style={{ width: '15%', position: 'absolute', padding: 14, backgroundColor: 'whitesmoke', borderRadius: 20 }}>
                                                                            <CircularProgressbar value={this.state.filesProgress} text={`${this.state.filesProgress}%`} /> 
                                                                            </div> : null 
                                                                        }
                                                                    </div>
                                                                    {
                                                                        this.state.isValid.value && this.state.isValid.name === 'code_file' ?
                                                                        <Form.Text style={{ color: 'red' }}>
                                                                            { this.state.isValid.text }
                                                                        </Form.Text> : ''
                                                                    }
                                                                </section>
                                                            )}
                                                        }
                                                    </Dropzone>
                                                </Col>
                                            </Form.Row>
                                            }

                                            <Form.Row>
                                                <Col md={{ span: 8, offset: 2 }}>
                                                    <div>
                                                        <Button type="submit" style={{ marginTop: '1.8rem', width: '100%' }} variant={"primary"}>
                                                            { 'Submit' }
                                                        </Button>
                                                        {
                                                            this.state.isValid.value ?
                                                            <Form.Text style={{ color: 'red' }}>
                                                                { this.state.isValid.text }
                                                            </Form.Text> : ''
                                                        }
                                                    </div>
                                                </Col>
                                            </Form.Row>
                                        </fieldset>
                                    </Form>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Aux>
        );
    }
}

const mapStateToProps = state => {
    return {
        user: state.userDetails.user
    }
}

export default connect(mapStateToProps, null)(AddAssignments);
