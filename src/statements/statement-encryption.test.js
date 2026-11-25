import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from '@cantoo/pdf-lib';
import { encryptPdfBlob, stripPdfMetadata } from './lib/encrypt.js';
import { normalizeStatement } from './lib/model.js';

test('normalizeStatement preserves encryptPdf and pdfPassword defaults and values', () => {
  const blank = normalizeStatement({ account: {} });
  assert.equal(blank.account.encryptPdf, false);
  assert.equal(blank.account.pdfPassword, '');

  const withPass = normalizeStatement({
    account: {
      encryptPdf: true,
      pdfPassword: 'my-secret-password',
    },
  });
  assert.equal(withPass.account.encryptPdf, true);
  assert.equal(withPass.account.pdfPassword, 'my-secret-password');
});

test('encryptPdfBlob protects PDF and requires correct password to decrypt', async () => {
  // 1. Create a dummy test PDF
  const testDoc = await PDFDocument.create();
  testDoc.addPage([200, 200]);
  const initialBytes = await testDoc.save();
  const initialBlob = new Blob([initialBytes], { type: 'application/pdf' });

  // 2. Encrypt with password
  const password = 'BankPassword2026';
  const encryptedBlob = await encryptPdfBlob(initialBlob, password);

  // 3. Verify that loading without password throws or requires authentication
  const encryptedBytes = new Uint8Array(await encryptedBlob.arrayBuffer());

  // Loading without password should fail
  await assert.rejects(
    async () => {
      await PDFDocument.load(encryptedBytes);
    },
    err => {
      assert.ok(err.message.includes('encrypted') || err.message.includes('password'));
      return true;
    }
  );

  // Loading with correct password should succeed
  const decryptedDoc = await PDFDocument.load(encryptedBytes, { password });
  assert.equal(decryptedDoc.getPageCount(), 1);
});

test('encryptPdfBlob returns unchanged blob when password is empty', async () => {
  const testDoc = await PDFDocument.create();
  testDoc.addPage([200, 200]);
  const initialBytes = await testDoc.save();
  const initialBlob = new Blob([initialBytes], { type: 'application/pdf' });

  const unencryptedBlob = await encryptPdfBlob(initialBlob, '');
  assert.equal(unencryptedBlob, initialBlob);

  const unencryptedBytes = new Uint8Array(await unencryptedBlob.arrayBuffer());
  const doc = await PDFDocument.load(unencryptedBytes);
  assert.equal(doc.getPageCount(), 1);
});

test('stripPdfMetadata completely removes producer and trailer metadata', async () => {
  const testDoc = await PDFDocument.create();
  testDoc.addPage([200, 200]);
  testDoc.setProducer('SomeProducer');
  testDoc.setTitle('SomeTitle');
  const initialBytes = await testDoc.save();
  const initialBlob = new Blob([initialBytes], { type: 'application/pdf' });

  const cleanBlob = await stripPdfMetadata(initialBlob);
  const cleanBytes = new Uint8Array(await cleanBlob.arrayBuffer());
  const cleanDoc = await PDFDocument.load(cleanBytes, { updateMetadata: false });
  assert.equal(cleanDoc.getProducer() || '', '');
  assert.equal(cleanDoc.getTitle() || '', '');
});
