package io.hawt.example.eurekaclientplugin;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.management.ManagementFactory;
import java.net.URLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

import javax.management.InstanceAlreadyExistsException;
import javax.management.MBeanServer;
import javax.management.ObjectName;

import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.methods.GetMethod;
import org.apache.commons.io.IOUtils;

public class EurekaClientHandler implements EurekaClientHandlerMBean {

	private static final Logger LOG = LoggerFactory.getLogger(EurekaClientHandler.class);

	private MBeanServer mBeanServer;
	private ObjectName objectName;

	protected ObjectName getObjectName() throws Exception {
		return new ObjectName("hawtio:type=EurekaClient");
	}

	@Override
	public String fetch(String eurekaUrl) {
		try {
			InputStream responseStream = new URL(eurekaUrl).openStream();
			try {
				return IOUtils.toString(new InputStreamReader(responseStream, StandardCharsets.UTF_8));
			} finally {
				IOUtils.closeQuietly(responseStream);
			}
		} catch (Exception e) {
			String result = "Cannot fetch list of servers from Eureka.\n" + e.getMessage();
			throw new RuntimeException(result);
		}
	}

	public void init() {
		if (objectName == null) {
			try {
				objectName = getObjectName();
			} catch (Exception e) {
				LOG.warn("Failed to create object name: ", e);
				throw new RuntimeException("Failed to create object name: ", e);
			}
		}

		if (mBeanServer == null) {
			mBeanServer = ManagementFactory.getPlatformMBeanServer();
		}

		if (mBeanServer != null) {
			try {
				mBeanServer.registerMBean(this, objectName);
			} catch (InstanceAlreadyExistsException iaee) {
				// Try to remove and re-register
				try {
					mBeanServer.unregisterMBean(objectName);
					mBeanServer.registerMBean(this, objectName);
				} catch (Exception e) {
					LOG.warn("Failed to register mbean: ", e);
					throw new RuntimeException("Failed to register mbean: ", e);
				}
			} catch (Exception e) {
				LOG.warn("Failed to register mbean: ", e);
				throw new RuntimeException("Failed to register mbean: ", e);
			}
		}
	}
}