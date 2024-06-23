import './App.css';
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
const certs = [];
function App() {
  const [file, setFile] = useState();
  const [account, setAccount] = useState(null);
  const AWS = require('aws-sdk');
  const s3 = new AWS.S3({
    accessKeyId: '34E2824FB6F26BD06745',
    secretAccessKey: 'A0NYB21D01IVsQeYpuz5lmND7zLUSuUfgihuyVGh',
    endpoint: 'https://s3.filebase.com',
    region: 'us-east-1',
    signatureVersion: 'v4'
  });
  const [web3Api, setweb3Api] = useState({
    porvider: null,
    web3: null
  });
  const [contract, setContract] = useState(null);
  //create reload
  const providerChanaged = (porvider) => {
    porvider.on("accountsChanged", _ => window.location.reload());
    porvider.on("chainChanged", _ => window.location.reload());
  }
  useEffect(() => {
    const loadProvider = async () => {
      const porvider = await detectEthereumProvider();
      if (porvider) {
        providerChanaged(porvider);
        setweb3Api(
          {
            porvider,
            web3: new Web3(porvider)
          }
        )
      } else {
        console.log("Please install metamask");
      }
    }
    loadProvider();
  }, [])
  //create hook for Accunts 
  useEffect(() => {
    const getAccounts = async () => {
      const accounts = await web3Api.web3.eth.getAccounts();
      setAccount(accounts[0])
    }
    web3Api.web3 && getAccounts();
  }, [web3Api.web3]
  )
  //load contract content
  useEffect(() => {
    const loadContract = async () => {
      const contractFile = await fetch('/certificate.json');
      console.log(contractFile.json)
      const convertContractFileToJson = await contractFile.json();
      const abi = convertContractFileToJson.abi
      const networkId = await web3Api.web3.eth.net.getId();
      const networkObject = convertContractFileToJson.networks[networkId];
      if (networkObject) {
        const address = networkObject.address;
        const deployedcontract = await new web3Api.web3.eth.Contract(abi, address)
        setContract(deployedcontract);
      }
      else {
        window.alert("please connect with Ganache     network")
      }
    }
    web3Api.web3 && loadContract();
  }, [web3Api.web3])
  //upload   file to filebase
  const [UrlHash, setUrlHash] = useState(null);
  const [hash, sethash] = useState();
  const handleFileSelect = (e) => {
    setFile(e.target.files[0]);
  }
  const uploadToS3 = async () => {
    if (!file) {
      return;
    }
    const params = {
      Bucket: 'certs',
      Key: `${file.name}`,
      Body: file,
    };
    console.log('key:', params.Key)
    console.log('params', params)
    const request = s3.putObject(params);
    await request.on('httpHeaders', (statusCode, headers) => {
      const obj = {
        fileName: file.name,
        fileHash: `${headers['x-amz-meta-cid']}`
      };
      certs.push(obj);
      setUrlHash(`https://ipfs.filebase.io/ipfs/${headers['x-amz-meta-cid']}`)
      sethash(`${headers['x-amz-meta-cid']}`);
      console.log("fike hash is", hash);
      console.log(`Go to https://ipfs.filebase.io/ipfs/${hash}`);
    });
    await request.send();
    console.log(certs);
  }
  const mint = async () => {
    if (UrlHash) {
      try {
        const r = await contract.methods.storHash(`${file.name}`, hash).send({ from: account })
        console.log('r is ', r);
        window.location.reload()
      }
      catch (error) { console.log(error) }
    }
    else {
      window.alert("You Should upload cert frist")
    }
  }
  return (
    <div className="App">
      {/* start nav bar*/}
      <nav className="navbar  navbar-dark bg-dark" >
        <div className="container-fluid">
          <a className="navbar-brand" ><h4><span className="text-success"></span>YCV </h4> </a>
          <form className="d-flex" role="search">
            <button className="btn btn-success" type="submit">Account is: {account}  </button>
          </form>
        </div>
      </nav>
      {/** hero */}
      <section className='bg-dark text-light text-center text-sm-start py-4'>
        <div className='container'>
          <div className='d-flex flex-row justify-content-between '>
            <h1>Yemen<span className='display-5 text-success align-self-start fw-bold'> Certificate Uploading</span><p className='py-3 lead align-self-start '>Uploading Certificate to Ipfs then the hash store in blockchain by smart contract </p></h1>
            <img className=' img-fluid w-40 d-sm-block align-self-end' src='images (10).jfif'></img>
          </div>
        </div>
      </section>
      {/* end the navbar*/}
      {/*start slogan*/}
      <div className='container'>
        {/*end  slogan*/}
        <hr className='my-2 bg-danger'></hr>
        {/*start upload section*/}
        <div className="input-group mb-3">
          <input type="file" className="form-control" id="inputGroupFile02" onChange={handleFileSelect} />
          <button className="input-group-text" htmlFor="inputGroupFile02" onClick={uploadToS3}>Upload to ipfs</button>
        </div>
        <div className='hash'>
          <div className="alert alert-success" role="alert">
            {
              hash ?
                <div className='p-2'>
                  File Hash is: {hash}
                </div> :
                <div className='p-2'>
                  Certificate  hash is:
                </div>
            }
          </div>
          {
            hash ?
              <button type="button" className="btn btn-success" onClick={mint}>Send To Blockchain</button>
              :
              <button type="button" className="btn btn-success" disabled onClick={mint}>Send To Blockchain</button>
          }
        </div>
      </div>
      {/*end upload section*/}
      {/* start map section */}
      <div className="row mx-2">
        {
          certs.map((cert, key) => {
            return (
              <section className='py-1 container d-flex align-items-center justify-content-center'>
                <div className="card" style={{ width: '55rem', height: '60rem' }}>
                  <object type="application/pdf" data={`https://ipfs.filebase.io/ipfs/${cert.fileHash}`} width="100%" height="400" style={{ width: '55rem', height: '55rem' }}>No Support</object>
                  <div className="card-body">
                    <h5 className="card-title">{cert.fileName}</h5>
                    <a href={`https://ipfs.filebase.io/ipfs/${cert.fileHash}`} target="_blank" rel="noopener noreferrer">https://ipfs.filebase.io/ipfs/{cert.fileHash}</a>
                  </div>
                </div>
              </section>
            )
          })
        }
        {/* end map section */}
      </div>
    </div>
  );
}
export default App;
